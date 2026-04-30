import asyncio
from datetime import datetime
from typing import Literal
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.schemas import (
    JobContext,
    JobState,
    TrainParams,
    TrainRequest,
    TrainWorkerRequest,
)
from app.services.managers.train_job_manager import (
    JOB_CLEANUP_AGE_SEC,
    ServerBusyError,
    TrainingJobManager,
    UserQuotaExceededError,
)


def _state(
    job_id: str,
    user_id: str,
    status: Literal["queued", "running", "done", "error"],
    created_at: str,
) -> JobState:
    return {
        "id": job_id,
        "userId": user_id,
        "networkId": "net-1",
        "method": "x",
        "status": status,
        "progress": 0.0,
        "createdAt": created_at,
        "startedAt": None,
        "accuracy": None,
        "loss": None,
        "error": None,
    }


def _ctx(
    job_id: str,
    user_id: str,
    status: Literal["queued", "running", "done", "error"],
    created_at: str,
) -> JobContext:
    monitor_task = MagicMock()
    monitor_task.done.return_value = True
    return JobContext(
        id=job_id,
        user_id=user_id,
        process=MagicMock(),
        pipe=MagicMock(),
        event_queue=asyncio.Queue(),
        monitor_task=monitor_task,
        data=_state(job_id, user_id, status, created_at),
    )


class _FakeConn:

    def __init__(self, messages=None, *args, **kwargs):
        self.messages = list(messages) if messages is not None else []
        self.closed = False

    def poll(self, *args, **kwargs):
        return bool(self.messages)

    def recv(self, *args, **kwargs):
        return self.messages.pop(0)

    def close(self, *args, **kwargs):
        self.closed = True


class _FakeProc:

    def __init__(self, alive=True):
        self._alive = alive
        self.pid = 111
        self.join_calls: list[float | None] = []
        self.kill_calls = 0

    def is_alive(self):
        return self._alive

    def terminate(self):
        self._alive = False

    def join(self, timeout=None, *args, **kwargs):
        self.join_calls.append(timeout)
        return None

    def kill(self):
        self.kill_calls += 1
        self._alive = False

    def close(self, *args, **kwargs):
        return None


class TestTrainingJobManager:

    async def test_create_job_success_one(
        self, job_manager: TrainingJobManager, monkeypatch
    ):
        req = TrainRequest(networkId="net-1", method="x", params=TrainParams())

        process = MagicMock()
        conn = MagicMock()

        to_thead_calls = 0
        spawn_calls = 0
        monitor_calls = 0

        async def fake_to_thread(func, *args, **kwargs):
            nonlocal to_thead_calls
            to_thead_calls += 1

            return func(*args, **kwargs)

        async def fake_monitor(*args, **kwargs):
            nonlocal monitor_calls
            monitor_calls += 1

            return "monitoring"

        def fake_spawn_worker(job_id, job_data):
            nonlocal spawn_calls
            spawn_calls += 1
            return process, conn

        monkeypatch.setattr(
            "app.services.managers.train_job_manager.asyncio.to_thread",
            fake_to_thread,
        )
        monkeypatch.setattr(job_manager, "_spawn_worker", fake_spawn_worker)
        monkeypatch.setattr(job_manager, "_monitor_process", fake_monitor)

        async def db_callback(*args, **kwargs):
            return True

        job_id = await job_manager.create_job("user-1", req, {}, db_callback)

        await asyncio.sleep(0.01)

        job = job_manager.get_job(job_id)
        assert job is not None
        assert job.user_id == "user-1"
        assert job.data["status"] == "queued"
        assert job.process is process
        assert job.pipe is conn
        assert job.monitor_task.result() == "monitoring"
        assert to_thead_calls == 1
        assert spawn_calls == 1
        assert monitor_calls == 1

    async def test_create_job_success_two(
        self, job_manager: TrainingJobManager, monkeypatch
    ):
        req = TrainRequest(networkId="net-1", method="x", params=TrainParams())

        process = MagicMock()
        conn = MagicMock()

        async def fake_to_thread(func, *args, **kwargs):
            return func(*args, **kwargs)

        async def fake_monitor(*args, **kwargs):
            return None

        monkeypatch.setattr(
            "app.services.managers.train_job_manager.asyncio.to_thread",
            fake_to_thread,
        )
        monkeypatch.setattr(
            job_manager, "_spawn_worker", lambda job_id, job_data: (process, conn)
        )
        monkeypatch.setattr(job_manager, "_monitor_process", fake_monitor)

        async def db_callback(*args, **kwargs):
            return True

        job_id1 = await job_manager.create_job("user-1", req, {}, db_callback)
        await asyncio.sleep(0.01)
        job = job_manager.get_job(job_id1)
        assert job is not None
        assert job.user_id == "user-1"
        assert job.data["status"] == "queued"

        job_id2 = await job_manager.create_job("user-2", req, {}, db_callback)
        await asyncio.sleep(0.01)
        assert job_id2 != job_id1

        job2 = job_manager.get_job(job_id2)
        assert job2 is not None
        assert job2.user_id == "user-2"
        assert job2.data["status"] == "queued"

    async def test_create_job_server_busy(
        self, job_manager: TrainingJobManager, training_process_count_1
    ):
        now = datetime.now().isoformat()
        job_manager._jobs["job-1"] = _ctx("job-1", "user-1", "queued", now)

        req = TrainRequest(networkId="net-2", method="x", params=TrainParams())

        async def db_callback(*args, **kwargs):
            return True

        with pytest.raises(ServerBusyError):
            await job_manager.create_job("user-2", req, {}, db_callback)

    async def test_create_job_user_quota_exceeded(
        self, job_manager: TrainingJobManager, training_process_count_2
    ):
        now = datetime.now().isoformat()
        job_manager._jobs["job-1"] = _ctx("job-1", "user-1", "running", now)

        req = TrainRequest(networkId="net-2", method="x", params=TrainParams())

        async def db_callback(*args, **kwargs):
            return True

        with pytest.raises(UserQuotaExceededError):
            await job_manager.create_job("user-1", req, {}, db_callback)

    def test_active_count_and_active_count_by_user(
        self, job_manager: TrainingJobManager
    ):
        now = datetime.now().isoformat()
        job_manager._jobs = {
            "a": _ctx("a", "u1", "queued", now),
            "b": _ctx("b", "u1", "running", now),
            "c": _ctx("c", "u1", "done", now),
            "d": _ctx("d", "u2", "running", now),
            "e": _ctx("e", "u2", "error", now),
        }

        assert job_manager.active_count() == 3
        assert job_manager.active_count_by_user("u1") == 2
        assert job_manager.active_count_by_user("u2") == 1

    def test_collect_old_jobs_raises_on_invalid_date(
        self, job_manager: TrainingJobManager, monkeypatch
    ):
        now = 2007483647
        monkeypatch.setattr(
            "app.services.managers.train_job_manager.time.time", lambda: now
        )

        old_done = datetime.fromtimestamp(now - (JOB_CLEANUP_AGE_SEC + 1)).isoformat()
        fresh_done = datetime.fromtimestamp(now - 10).isoformat()

        job_manager._jobs = {
            "old": _ctx("old", "u1", "done", old_done),
            "fresh": _ctx("fresh", "u1", "done", fresh_done),
            "bad": _ctx("bad", "u2", "error", "not-a-date"),
            "running": _ctx("running", "u2", "running", old_done),
        }

        with pytest.raises(ValueError):
            job_manager._collect_old_jobs()

    def test_collect_old_jobs(self, job_manager: TrainingJobManager, monkeypatch):
        now = 2007483647
        monkeypatch.setattr(
            "app.services.managers.train_job_manager.time.time", lambda: now
        )

        old_done = datetime.fromtimestamp(now - (JOB_CLEANUP_AGE_SEC + 1)).isoformat()
        fresh_done = datetime.fromtimestamp(now - 10).isoformat()

        job_manager._jobs = {
            "old": _ctx("old", "u1", "done", old_done),
            "fresh": _ctx("fresh", "u1", "done", fresh_done),
            "running": _ctx("running", "u2", "running", old_done),
        }

        ids = job_manager._collect_old_jobs()
        assert set(ids) == {"old"}

    async def test_create_job_spawn_failure(self, job_manager, monkeypatch):
        req = TrainRequest(networkId="n-1", method="x", params=TrainParams())

        async_to_thread = AsyncMock(side_effect=RuntimeError("o-o"))
        monkeypatch.setattr(
            "app.services.managers.train_job_manager.asyncio.to_thread",
            async_to_thread,
        )

        async def db_callback(*args, **kwargs):
            return True

        with pytest.raises(RuntimeError, match="o-o"):
            await job_manager.create_job("u1", req, {}, db_callback)

    async def test_bulk_stop_jobs_cancels_tasks_and_removes_jobs(
        self, job_manager: TrainingJobManager, monkeypatch
    ):

        async def sleeper():
            await asyncio.sleep(60)

        task = asyncio.create_task(sleeper())
        await asyncio.sleep(0.01)
        pipe = MagicMock()
        process = MagicMock()
        process.is_alive.return_value = True
        state = _state("job-1", "user-1", "running", datetime.now().isoformat())

        job_manager._jobs = {
            "job-1": JobContext(
                "job-1", "user-1", process, pipe, asyncio.Queue(), task, state
            )
        }

        to_thread = AsyncMock(return_value=None)
        monkeypatch.setattr(
            "app.services.managers.train_job_manager.asyncio.to_thread", to_thread
        )

        await job_manager._bulk_stop_jobs(["job-1"])

        assert "job-1" not in job_manager._jobs
        assert task.cancelled()
        assert to_thread.await_count == 1

    async def test_bulk_stop_jobs_handles_wait_timeout(self, job_manager, monkeypatch):

        async def sleeper():
            await asyncio.sleep(60)

        task = asyncio.create_task(sleeper())
        await asyncio.sleep(0.01)
        process = MagicMock()
        process.is_alive.return_value = False
        job = JobContext(
            "job-timeout",
            "user-1",
            process,
            MagicMock(),
            asyncio.Queue(),
            task,
            _state("job-timeout", "user-1", "running", datetime.now().isoformat()),
        )
        job_manager._jobs = {"job-timeout": job}

        async def timeout_wait(*args, **kwargs):
            raise asyncio.TimeoutError()

        monkeypatch.setattr(
            "app.services.managers.train_job_manager.asyncio.wait_for", timeout_wait
        )
        monkeypatch.setattr(
            "app.services.managers.train_job_manager.asyncio.to_thread",
            AsyncMock(return_value=None),
        )

        await job_manager._bulk_stop_jobs(["job-timeout"])
        assert job_manager._jobs == {}

    def test_spawn_worker_closes_parent_conn_when_start_fails(
        self, job_manager: TrainingJobManager, monkeypatch
    ):
        parent_conn = MagicMock()
        child_conn = MagicMock()

        class BadProcess:
            def start(self):
                raise RuntimeError("start failed")

        class FakeContext:
            def Pipe(self):
                return parent_conn, child_conn

            def Process(self, *args, **kwargs):
                return BadProcess()

        monkeypatch.setattr(
            "app.services.managers.train_job_manager.get_context",
            lambda method: FakeContext(),
        )

        payload = TrainWorkerRequest(network={}, params=TrainParams())
        with pytest.raises(RuntimeError, match="start failed"):
            job_manager._spawn_worker("job-1", payload)

        parent_conn.close.assert_called_once()
        child_conn.close.assert_called_once()

    async def test_monitor_process_good(
        self, job_manager: TrainingJobManager, monkeypatch
    ):
        process = _FakeProc(alive=True)
        conn = _FakeConn(
            [
                {"type": "progress", "value": 0.5},
                {"type": "done", "nn": {}, "meta": {}, "accuracy": 0.9, "loss": 0.1},
            ]
        )
        queue = asyncio.Queue()
        state = _state("job-done", "user-1", "queued", datetime.now().isoformat())

        db_called = False

        async def db_callback(*args, **kwargs):
            nonlocal db_called
            db_called = True
            return True

        created_tasks = []
        original_create_task = asyncio.create_task

        async def fake_to_thread(func, *args, **kwargs):
            return func(*args, **kwargs)

        def capture_create_task(coroutine):
            task = original_create_task(coroutine)
            created_tasks.append(task)
            return task

        monkeypatch.setattr(
            "app.services.managers.train_job_manager.asyncio.to_thread",
            fake_to_thread,
        )
        monkeypatch.setattr(
            "app.services.managers.train_job_manager.asyncio.create_task",
            capture_create_task,
        )

        await job_manager._monitor_process(
            "job-done", process, conn, queue, state, db_callback
        )

        # fire and forget kill_procs call needs to be awaited
        if created_tasks:
            assert len(created_tasks) == 1
            await asyncio.gather(*created_tasks)

        assert state["status"] == "done"
        assert state["progress"] == 1.0
        assert db_called is True
        assert conn.closed is True
        assert not process.is_alive()
        assert process.join_calls == [1.0]
        assert process.kill_calls == 0

        events = []
        while not queue.empty():
            events.append(await queue.get())
        assert len([e for e in events if e["type"] == "progress"]) == 1
        assert len([e for e in events if e["type"] == "done"]) == 1
        assert len([e for e in events if e["type"] == "error"]) == 0

    async def test_monitor_process_worker_error_sets_error_state(
        self, job_manager: TrainingJobManager
    ):
        process = _FakeProc(alive=True)
        conn = _FakeConn([{"type": "error", "message": "worker blew up o-o"}])
        queue = asyncio.Queue()
        state = _state("job-err", "user-1", "queued", datetime.now().isoformat())

        db_called = False

        async def db_callback(*args, **kwargs):
            nonlocal db_called
            db_called = True
            return True

        await job_manager._monitor_process(
            "job-err", process, conn, queue, state, db_callback
        )

        assert state["status"] == "error"
        assert "worker blew up o-o" == state["error"]
        event = await queue.get()
        assert event["type"] == "error"
        assert event["error"] == "worker blew up o-o"
        assert db_called is False
