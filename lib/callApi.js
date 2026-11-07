// Browser side: what the forms and buttons use to call our API.
// Always returns { ok, data } so we handle errors the same way everywhere.
// e.g. const { ok, data } = await callApi("/api/tasks", "POST", { title: "Read ch. 3" });
export async function callApi(url, method, body) {
  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, data };
  } catch {
    // server is off or no internet
    return { ok: false, data: { message: "Could not reach the server. Try again." } };
  }
}
