import asyncio
from unittest.mock import MagicMock
from app.schemas.jobs import JobContext
from app.schemas.trainers import TrainingLevel
import pytest
import dataclasses


class TestDataClasses:
    def test_job_context_equality_and_hash_by_id(self):
        queue = asyncio.Queue()
        monitor_task = MagicMock()

        job_a = JobContext(
            id="job-1",
            user_id="user-1",
            process=MagicMock(),
            pipe=MagicMock(),
            event_queue=queue,
            monitor_task=monitor_task,
            data={
                "id": "job-1",
                "userId": "user-1",
                "networkId": "net-1",
                "method": "x",
                "status": "queued",
                "progress": 0.0,
                "createdAt": "2024-01-01T00:00:00",
                "startedAt": None,
                "accuracy": None,
                "loss": None,
                "error": None,
            },
        )
        job_b = JobContext(
            id="job-1",
            user_id="another-user",
            process=MagicMock(),
            pipe=MagicMock(),
            event_queue=asyncio.Queue(),
            monitor_task=MagicMock(),
            data={
                "id": "job-1",
                "userId": "another-user",
                "networkId": "net-2",
                "method": "y",
                "status": "running",
                "progress": 0.5,
                "createdAt": "2024-01-02T00:00:00",
                "startedAt": None,
                "accuracy": None,
                "loss": None,
                "error": None,
            },
        )

        assert job_a == job_b
        assert len({job_a, job_b}) == 1

    def test_training_level_frozen_hashable_and_eq(self):
        level_1 = TrainingLevel(1, "MEDIUM", threshold=0.3, minimax_prob=0.5)
        level_2 = TrainingLevel(1, "MEDIUM", threshold=0.3, minimax_prob=0.5)
        level_3 = TrainingLevel(2, "HARD", threshold=0.6, minimax_prob=0.8)

        assert level_1 == level_2
        assert level_1 != level_3
        assert len({level_1, level_2, level_3}) == 2
        with pytest.raises(dataclasses.FrozenInstanceError):
            level_1.name = "EASY"
