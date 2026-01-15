use axum::{routing::get, Json, Router};
use serde::Serialize;

use crate::middleware::OptionalAuthUser;
use crate::AppState;

// ============================================================
// 公開 API（認証不要）
// ============================================================

#[derive(Serialize)]
struct HealthResponse {
    status: &'static str,
}

async fn health() -> Json<HealthResponse> {
    Json(HealthResponse { status: "ok" })
}

// ============================================================
// 任意認証 API（FromRequestParts を使用）
// - ログインしていれば追加情報を表示
// - ログインしていなくても基本情報は表示
// ============================================================

#[derive(Serialize)]
struct GreetingResponse {
    message: String,
    /// ログインしている場合のみ表示
    user_name: Option<String>,
    /// ログイン状態
    is_logged_in: bool,
}

/// 任意認証の例: 挨拶 API
/// - ログインしていれば「こんにちは、{name}さん！」
/// - ログインしていなければ「こんにちは、ゲストさん！」
async fn greeting(OptionalAuthUser(user): OptionalAuthUser) -> Json<GreetingResponse> {
    match user {
        Some(u) => Json(GreetingResponse {
            message: format!("こんにちは、{}さん！", u.name),
            user_name: Some(u.name),
            is_logged_in: true,
        }),
        None => Json(GreetingResponse {
            message: "こんにちは、ゲストさん！".to_string(),
            user_name: None,
            is_logged_in: false,
        }),
    }
}

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/health", get(health))
        .route("/greeting", get(greeting)) // 任意認証 API
}
