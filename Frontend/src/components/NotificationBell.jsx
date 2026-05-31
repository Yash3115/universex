import { useEffect, useState } from "react";
import { FaBell } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  respondToConnectionNotification,
} from "../features/notifications/notificationsSlice";

const getNotificationTarget = (notification) => {
  if (notification.type === "Connection") return "/students";
  if (notification.type === "Interaction") return "/interactions";
  if (notification.assessment?._id) return "/results";
  if (notification.type === "Academic") return notification.course?._id ? `/courses/${notification.course._id}` : "/courses";
  if (notification.job?._id) return "/jobs";
  if (notification.post?._id) return "/community";
  return "/dashboard";
};

const NotificationBell = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { actionLoadingByConnectionId, items, unreadCount } = useSelector((state) => state.notifications);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchNotifications());
      const intervalId = setInterval(() => dispatch(fetchNotifications()), 60_000);
      return () => clearInterval(intervalId);
    }
  }, [dispatch, isAuthenticated]);

  if (!isAuthenticated) return null;

  const handleOpenNotification = (notification) => {
    if (!notification.read) dispatch(markNotificationRead(notification._id));
    setOpen(false);
    navigate(getNotificationTarget(notification));
  };

  const handleConnectionResponse = async (event, notification, status) => {
    event.stopPropagation();
    const connectionId = notification.connection?._id || notification.connection;
    if (!connectionId) return;

    await dispatch(
      respondToConnectionNotification({
        connectionId,
        notificationId: notification._id,
        status,
      })
    );
  };

  return (
    <div className="relative">
      <button
        type="button"
        className="relative rounded-full border border-gray-200 bg-white p-3 text-gray-700 shadow-sm transition hover:border-blue-200 hover:text-blue-700"
        onClick={() => setOpen((prev) => !prev)}
      >
        <FaBell />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-3 w-80 overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b p-4">
            <h3 className="font-black text-gray-900">Notifications</h3>
            <button className="text-xs font-bold text-blue-600" onClick={() => dispatch(markAllNotificationsRead())}>
              Mark all read
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto p-2">
            {items.length ? items.map((notification) => {
              const connectionId = notification.connection?._id || notification.connection;
              const isIncomingConnectionRequest =
                notification.type === "Connection" &&
                notification.connection?.status === "pending" &&
                String(notification.connection?.recipient) !== String(notification.sender?._id);
              const actionLoading = Boolean(actionLoadingByConnectionId[connectionId]);

              return (
              <button
                key={notification._id}
                type="button"
                className={`w-full rounded-2xl p-3 text-left transition hover:bg-blue-50 ${notification.read ? "bg-white" : "bg-blue-50/70"}`}
                onClick={() => handleOpenNotification(notification)}
              >
                <p className="text-sm font-semibold text-gray-800">
                  {notification.sender?.firstName || "UniverseX"} {notification.message || notification.type}
                </p>
                {notification.job?.title && <p className="text-xs text-gray-500">{notification.job.title}</p>}
                {notification.post?.content && <p className="line-clamp-1 text-xs text-gray-500">{notification.post.content}</p>}
                {isIncomingConnectionRequest && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <span
                      role="button"
                      tabIndex={0}
                      className="rounded-xl bg-blue-600 px-3 py-2 text-center text-xs font-bold text-white"
                      onClick={(event) => handleConnectionResponse(event, notification, "accepted")}
                    >
                      {actionLoading ? "Accepting..." : "Accept"}
                    </span>
                    <span
                      role="button"
                      tabIndex={0}
                      className="rounded-xl bg-gray-100 px-3 py-2 text-center text-xs font-bold text-gray-600"
                      onClick={(event) => handleConnectionResponse(event, notification, "rejected")}
                    >
                      Ignore
                    </span>
                  </div>
                )}
                <p className="mt-1 text-[11px] text-gray-400">{new Date(notification.createdAt).toLocaleString()}</p>
              </button>
            );
            }) : (
              <p className="p-6 text-center text-sm text-gray-500">No notifications yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;