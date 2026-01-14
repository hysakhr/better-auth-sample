use std::env;
use std::net::SocketAddr;

use axum::Router;
use sea_orm::Database;
use tower_http::cors::{Any, CorsLayer};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod entity;
mod middleware;
mod routes;

#[derive(Clone)]
pub struct AppState {
    pub db: sea_orm::DatabaseConnection,
}

#[tokio::main]
async fn main() {
    // 環境変数の読み込み
    dotenvy::dotenv().ok();

    // ロギングの初期化
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    // データベース接続
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let db = Database::connect(&database_url)
        .await
        .expect("Failed to connect to database");

    let state = AppState { db };

    // CORS 設定
    let frontend_url = env::var("FRONTEND_URL").unwrap_or_else(|_| "http://localhost:3050".into());
    let cors = CorsLayer::new()
        .allow_origin(frontend_url.parse::<axum::http::HeaderValue>().unwrap())
        .allow_methods(Any)
        .allow_headers(Any)
        .allow_credentials(true);

    // ルーター構築
    let app = Router::new()
        .nest("/api", routes::routes())
        .layer(cors)
        .with_state(state);

    // サーバー起動
    let port: u16 = env::var("SERVER_PORT")
        .unwrap_or_else(|_| "3051".into())
        .parse()
        .expect("SERVER_PORT must be a valid port number");

    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    tracing::info!("Server listening on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
