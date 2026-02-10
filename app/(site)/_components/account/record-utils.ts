export function getStatusColor(status: string) {
  switch (status) {
    case "PENDING":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
    case "SHIPPED":
    case "PICKED_UP":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    case "ACTIVE":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    case "PAUSED":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
    case "CANCELLED":
    case "CANCELED":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    case "PAST_DUE":
    case "FAILED":
      return "bg-red-200 text-red-900 dark:bg-red-900/50 dark:text-red-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
  }
}

export function getStatusLabel(status: string) {
  switch (status) {
    case "PICKED_UP":
      return "Picked Up";
    case "CANCELLED":
      return "Canceled";
    case "PAST_DUE":
      return "Past Due";
    case "FAILED":
      return "Failed";
    default:
      return status.charAt(0) + status.slice(1).toLowerCase();
  }
}
