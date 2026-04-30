import uuid
import asyncio
from unittest.mock import MagicMock


class FakeJobContext:
    def __init__(self, job_id, user_id, network_id):
        self.user_id = user_id
        self.data = {
            "id": job_id,
            "networkId": network_id,
            "status": "queued",
            "progress": 0.0,
            "loss": None,
            "accuracy": None,
            "error": None,
            "createdAt": "2024-01-01T00:00:00",
            "startedAt": None,
        }
        self.event_queue = asyncio.Queue()
        self.monitor_task = MagicMock()
        self.monitor_task.done.return_value = False
        self.monitor_task.cancel = MagicMock()


class FakeJobManager:
    def __init__(self):
        self.jobs = {}

    async def create_job(self, user_id, req, network_json, db_callback):
        job_id = str(uuid.uuid4())

        self.jobs[job_id] = FakeJobContext(job_id, user_id, req.networkId)

        return job_id

    def get_job(self, job_id):
        return self.jobs.get(job_id)

    async def shutdown_all(self):
        self.jobs.clear()
