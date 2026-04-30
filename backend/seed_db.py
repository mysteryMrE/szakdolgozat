import asyncio
from app.utils import init_network

from app.database.database_manager import DatabaseManager
from app.services.authenticator import Authenticator
from app.core.config import AppConfig


async def seed():
    config: AppConfig = AppConfig.get_instance()
    print("Initializing Database Manager...")
    db_manager = DatabaseManager()
    db = db_manager.get_database()

    await db.drop_schema()

    await db.create_database_tables()
    auth = Authenticator()
    password = "password123"
    password_hash = auth.hash_password(password)

    users_to_create = 10000
    networks_per_user = 2

    print(f"Seeding {users_to_create} users with {networks_per_user} networks each...")

    dummy_nn_values = init_network().model_dump()
    for i in range(users_to_create):
        user_id = str(i)
        username = f"user_{i}"

        try:
            existing = await db.get_user_by_name(username)
            if existing:
                user_id = existing["id"]
            else:
                await db.create_user(user_id, username, password_hash)
        except Exception as e:
            print(f"Error creating user {username}: {e}")
            continue
        for j in range(networks_per_user):
            network_id = f"user_{user_id}_net_{j}"
            network_name = f"net_{j}"
            meta_json = {}

            try:
                await db.insert_network(
                    network_id, user_id, network_name, dummy_nn_values, meta_json
                )
            except Exception as e:
                print(f"Error creating network {network_name} for user {username}: {e}")

        if i % 100 == 0:
            print(f"Processed {i} users...")

    # defaults
    await db.create_user(
        "admin",
        "admin",
        password_hash,
    )
    await db.insert_menace(
        config.get_default_menace_id(), "admin", "Default Menace", {}, {}
    )
    await db.insert_network(
        config.get_default_backprop_nn_id(),
        "admin",
        "Default Backprop",
        dummy_nn_values,
        {},
    )
    await db.insert_evolution_network(
        config.get_default_genetic_nn_ind_id(), "admin", dummy_nn_values, {}
    )

    print("Seeding complete.")


if __name__ == "__main__":
    asyncio.run(seed())
