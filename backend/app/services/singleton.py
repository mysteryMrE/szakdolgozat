from threading import Lock as thread_lock

"""
AI assisted singleton implementation.
"""


class Singleton(type):

    # At class definition time
    def __init__(cls, name, bases, dict):
        super().__init__(name, bases, dict)
        cls._instance = None
        cls._lock = thread_lock()

    # Intercept calls to the class (e.g. X())
    def __call__(cls, *args, **kwargs):
        return cls.get_instance(*args, **kwargs)

    def get_instance(cls, *args, **kwargs):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    # X.__new__ and X.__init__
                    cls._instance = super().__call__(*args, **kwargs)
        return cls._instance

    def reset_instance(cls):
        with cls._lock:
            cls._instance = None
