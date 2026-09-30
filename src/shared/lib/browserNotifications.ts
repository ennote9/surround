export type BrowserNotificationPermission =
  | NotificationPermission
  | "unsupported"

export function getBrowserNotificationPermission(): BrowserNotificationPermission {
  if (
    typeof window === "undefined" ||
    typeof Notification === "undefined"
  ) {
    return "unsupported"
  }
  return Notification.permission
}

export async function requestBrowserNotificationPermission(): Promise<BrowserNotificationPermission> {
  if (typeof Notification === "undefined") return "unsupported"
  return Notification.requestPermission()
}

export async function showBrowserNotification(params: {
  title: string
  body: string
  tag?: string
  url?: string
}): Promise<boolean> {
  if (
    typeof window === "undefined" ||
    typeof Notification === "undefined" ||
    Notification.permission !== "granted"
  ) {
    return false
  }

  const options: NotificationOptions = {
    body: params.body,
    tag: params.tag,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: { url: params.url ?? "/projects" },
  }

  try {
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.ready
      await registration.showNotification(params.title, options)
      return true
    }

    const notification = new Notification(params.title, options)
    notification.onclick = () => {
      window.focus()
      if (params.url) window.location.assign(params.url)
      notification.close()
    }
    return true
  } catch {
    return false
  }
}
