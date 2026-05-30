import { useEffect, useState } from "react";
import { FaBell } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../features/notifications/notificationsSlice";

const getNotificationTarget = (notification) => {
  if (notification.job?._id) return "/jobs";
  if (notification.post?._id) return "/community";
  return "/dashboard";
};

const NotificationBell = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, unreadCount } = useSelector((state) => state.notifications);
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
            {items.length ? items.map((notification) => (
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
                <p className="mt-1 text-[11px] text-gray-400">{new Date(notification.createdAt).toLocaleString()}</p>
              </button>
            )) : (
              <p className="p-6 text-center text-sm text-gray-500">No notifications yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;