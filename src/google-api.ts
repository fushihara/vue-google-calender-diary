import dateformat from "dateformat";
export namespace GoogleApi {
  export namespace Auth {
    const 必要なスコープ一覧 = [
      "https://www.googleapis.com/auth/calendar.readonly",
      "https://www.googleapis.com/auth/calendar.events",
    ];
    export type SetupResult = { mode: "get-refresh-token", refreshToken: string, redirectUrl: string } | { mode: "get-access-token", accessToken: string } | "no-token"
    export async function setup(apiDetail?: { リダイレクトURL: string, クライアントID: string, クライアントシークレット: string, リフレッシュトークン: string }): Promise<SetupResult> {
      const URLにcodeがある = document.location.href.match(/\?code=(.+?)&/) != null;
      if (chrome && chrome.identity && chrome.identity.getAuthToken) {
        return new Promise<SetupResult>((resolve) => {
          chrome.identity.getAuthToken({ interactive: false }, token => {
            if (!token) {
              // トークンが取得できなかった。
              resolve("no-token")
            } else {
              resolve({ mode: "get-access-token", accessToken: token });
            }
          })
        });
      } else if (apiDetail === undefined) {
        return "no-token";
      } else if (URLにcodeがある) {
        const code = RegExp.$1;
        return new Promise(resolve => {
          getAccessTokenNewGet(code, apiDetail.リダイレクトURL, apiDetail.クライアントID, apiDetail.クライアントシークレット).then(a => {
            const 不足しているスコープ一覧 = 必要なスコープ一覧.filter(スコープ => a.scopes.includes(スコープ) == false);
            if (0 < 不足しているスコープ一覧.length) {
              resolve("no-token")
            } else {
              resolve({ mode: "get-refresh-token", refreshToken: a.refreshToken, redirectUrl: apiDetail.リダイレクトURL })
            }
          }).catch(e => {
            alert(`コードからアクセストークンとリフレッシュトークンを取得する事に失敗しました。\n${e}`);
            resolve({ mode: "get-refresh-token", refreshToken: "", redirectUrl: apiDetail.リダイレクトURL })
          });
        })
      } else if (apiDetail.リフレッシュトークン !== "") {
        return getAccessTokenRefresh(apiDetail.リフレッシュトークン, apiDetail.クライアントID, apiDetail.クライアントシークレット).then<"no-token" | { mode: "get-access-token", accessToken: string }>(b => {
          const 不足しているスコープ一覧 = 必要なスコープ一覧.filter(スコープ => b.scopes.includes(スコープ) == false);
          if (0 < 不足しているスコープ一覧.length) {
            return "no-token" as const;
          } else {
            return { mode: "get-access-token", accessToken: b.accessToken };
          }
        }).catch(e => {
          alert(`コードからアクセストークンとリフレッシュトークンを取得する事に失敗しました。\n${e}`);
          return "no-token" as const;
        });
      } else {
        return "no-token";
      }
    }
    export function getAuthStartUrl(val: { クライアントID: string, リダイレクトURI: string, }): string {
      const urlBase = `https://accounts.google.com/o/oauth2/auth`;
      const params = [];
      params.push(`response_type=code`);
      params.push(`client_id=${val.クライアントID}`);
      params.push(`redirect_uri=${val.リダイレクトURI}`);
      params.push(`scope=${encodeURIComponent(必要なスコープ一覧.join(" "))}`);
      params.push(`access_type=offline`);
      params.push(`approval_prompt=force`);
      const accessUrl = `${urlBase}?${params.join("&")}`;
      return accessUrl;
    }
    async function getAccessTokenNewGet(requestCode: string, リダイレクトURL: string, クライアントID: string, クライアントシークレット: string): Promise<{ accessToken: string, expiresInSecond: number, refreshToken: string, scopes: string[] }> {
      const postValues = [];
      postValues.push(`code=${encodeURIComponent(requestCode)}`);
      postValues.push(`client_id=${encodeURIComponent(クライアントID)}`);
      postValues.push(`client_secret=${encodeURIComponent(クライアントシークレット)}`);
      postValues.push(`redirect_uri=${encodeURIComponent(リダイレクトURL)}`);
      postValues.push(`grant_type=authorization_code`);
      postValues.push(`access_type=offline`);
      return fetch(`https://www.googleapis.com/oauth2/v4/token`, {
        method: "post",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: postValues.join("&")
      })
        .then(async request => {
          return request.json().then(json => {
            const accessToken = String(json.access_token || "");
            const expiresInSecond = Number(json.expires_in || "0");
            const refreshToken = String(json.refresh_token || "");
            const scopes = String(json.scope || "").split(" ")
            return {
              accessToken, expiresInSecond, refreshToken, scopes
            }
          });
        });
    }
    async function getAccessTokenRefresh(リフレッシュトークン: string, クライアントID: string, クライアントシークレット: string): Promise<{ accessToken: string, expiresInSecond: number, scopes: string[] }> {
      const postValues = [];
      postValues.push(`refresh_token=${encodeURIComponent(リフレッシュトークン)}`);
      postValues.push(`client_id=${encodeURIComponent(クライアントID)}`);
      postValues.push(`client_secret=${encodeURIComponent(クライアントシークレット)}`);
      postValues.push(`grant_type=refresh_token`);
      postValues.push(`access_type=offline`);
      return fetch(`https://www.googleapis.com/oauth2/v4/token`, {
        method: "post",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: postValues.join("&")
      }).then(async request => {
        return request.json().then(json => {
          const accessToken = String(json.access_token || "");
          const expiresInSecond = Number(json.expires_in || "0");
          const scopes = String(json.scope || "").split(" ")
          return {
            accessToken, expiresInSecond, scopes
          }
        });
      });
    }
  }
  export namespace Calender {
    export type CalenderType = { color: string, id: string, name: string, description: string, accessRole: "owner" | "reader", primary: boolean }
    function isCalenderApiResult(data: any): data is { items: { backgroundColor: string, id: string, summary: string, accessRole: "owner" | "reader", primary?: true, summaryOverride?: string, description?: string }[] } {
      if (data == null || typeof data != "object") { return false; }
      if (Array.isArray(data.items) == false) { return false; }
      for (let item of data.items) {
        if (item == null || typeof item != "object") { return false; }
        if (typeof item.backgroundColor !== "string") { return false; }
        if (typeof item.id !== "string") { return false; }
        if (typeof item.summary !== "string") { return false; }
        if (typeof item.accessRole !== "string") { return false; }
        if (["owner", "reader"].includes(item.accessRole) == false) { return false; }
        if (item.primary !== undefined && typeof item.primary !== "boolean") { return false; }
        if (item.summaryOverride !== undefined && typeof item.summaryOverride !== "string") { return false; }
        if (item.description !== undefined && typeof item.description !== "string") { return false; }
      }
      return true;
    }
    export async function getCalenderList(accessToken: string): Promise<CalenderType[]> {
      const requestUrl = `https://www.googleapis.com/calendar/v3/users/me/calendarList?` + [
        `maxResults=250`,
        `showDeleted=true`,

      ].join("&");
      return fetch(
        requestUrl,
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${accessToken}`
          }
        }
      ).then(request => request.json().then<CalenderType[]>(json => {
        if (isCalenderApiResult(json)) {
          const result: CalenderType[] = [];
          for (let i of json.items) {
            result.push({
              id: i.id,
              color: i.backgroundColor,
              name: i.summaryOverride ? i.summaryOverride : i.summary,
              description: i.description ? i.description : "",
              primary: i.primary ? i.primary : false,
              accessRole: i.accessRole,
            });
          }
          return result;
        } else {
          return [];
        }
      }))
    }
    export async function postSchedule(accessToken: string, date: Date, message: string, calenderId: string) {
      const postJsonText = JSON.stringify({
        end: {
          dateTime: dateformat(date, "yyyy-mm-dd'T'HH:MM:ss+09:00")
        },
        start: {
          dateTime: dateformat(date, "yyyy-mm-dd'T'HH:MM:ss+09:00")
        },
        summary: message.split("\n")[0],
        description: message
      })
      return fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calenderId)}/events`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
          "content-type": "application/json"
        },
        body: postJsonText,
        method: "POST",
        cache: "no-cache"
      }).then(request => request.json().then(json => {
        debugger;
      }))
    }
  }
}