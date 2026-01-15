use axum::{
    extract::{FromRequestParts, Request, State},
    http::{request::Parts, StatusCode},
    middleware::Next,
    response::Response,
};
use axum_extra::extract::CookieJar;
use sea_orm::{ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter};

use crate::entity::{sessions, users};
use crate::AppState;

/// 認証済みユーザー情報
#[derive(Clone, Debug)]
pub struct AuthUser {
    pub id: String,
    pub name: String,
    pub email: String,
    pub email_verified: bool,
    pub image: Option<String>,
}

/// リクエストから認証ユーザーを取得する拡張（middleware 用）
#[derive(Clone)]
pub struct AuthExtension(pub AuthUser);

/// Better Auth の Cookie からセッショントークンを取得
fn extract_session_token(cookies: &CookieJar) -> Option<String> {
    // Better Auth は "better-auth.session_token" という名前で Cookie を設定
    // フォーマット: {token}.{signature}
    cookies
        .get("better-auth.session_token")
        .map(|c| c.value().to_string())
        .and_then(|value| {
            // トークン部分のみを抽出（署名部分は除外）
            value.split('.').next().map(|s| s.to_string())
        })
}

/// Cookie とセッションからユーザーを取得する共通関数
async fn get_user_from_session(
    db: &DatabaseConnection,
    cookies: &CookieJar,
) -> Option<AuthUser> {
    // Cookie からトークンを取得
    let token = extract_session_token(cookies)?;

    // セッションをデータベースから検索
    let session = sessions::Entity::find()
        .filter(sessions::Column::Token.eq(&token))
        .one(db)
        .await
        .ok()??;

    // セッションの有効期限をチェック
    if session.expires_at < chrono::Utc::now() {
        return None;
    }

    // ユーザー情報を取得
    let user = users::Entity::find_by_id(&session.user_id)
        .one(db)
        .await
        .ok()??;

    // 退会済みユーザーは None
    if user.deleted_at.is_some() {
        return None;
    }

    Some(AuthUser {
        id: user.id,
        name: user.name,
        email: user.email,
        email_verified: user.email_verified,
        image: user.image,
    })
}

// ============================================================
// アプローチ1: middleware（必須認証ルート用）
// - Router 全体にレイヤーとして適用
// - 認証失敗で即 401
// ============================================================

/// 認証ミドルウェア（必須認証用）
pub async fn auth_middleware(
    State(state): State<AppState>,
    cookies: CookieJar,
    mut request: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let auth_user = get_user_from_session(&state.db, &cookies)
        .await
        .ok_or(StatusCode::UNAUTHORIZED)?;

    request.extensions_mut().insert(AuthExtension(auth_user));
    Ok(next.run(request).await)
}

// ============================================================
// アプローチ2: FromRequestParts（任意認証用）
// - ハンドラ引数で OptionalAuthUser として受け取る
// - 認証失敗でも処理継続（user が None になるだけ）
// ============================================================

/// 任意認証用のラッパー型
/// 使い方: async fn handler(OptionalAuthUser(user): OptionalAuthUser) -> ...
pub struct OptionalAuthUser(pub Option<AuthUser>);

impl FromRequestParts<AppState> for OptionalAuthUser {
    type Rejection = std::convert::Infallible; // 絶対に失敗しない

    async fn from_request_parts(
        parts: &mut Parts,
        state: &AppState,
    ) -> Result<Self, Self::Rejection> {
        // CookieJar を手動で取得
        let cookies = CookieJar::from_headers(&parts.headers);

        // 認証に失敗しても None を返すだけ（エラーにならない）
        let user = get_user_from_session(&state.db, &cookies).await;
        Ok(OptionalAuthUser(user))
    }
}
