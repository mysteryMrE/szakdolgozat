if __name__ == "__main__":
    import uvicorn
    from app.core.fastapi_app import create_app

    app = create_app()
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        timeout_graceful_shutdown=10,
        ws_ping_interval=10,
        ws_ping_timeout=10,
        # log_level="trace",
        proxy_headers=False,
    )
