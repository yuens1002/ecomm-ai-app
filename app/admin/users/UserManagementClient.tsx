"use client";

import { useState, useEffect, useCallback } from "react";
import { getErrorMessage } from "@/lib/error-utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Shield, ShieldOff, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UserData {
  id: string;
  name: string | null;
  email: string | null;
  isAdmin: boolean;
  createdAt: string;
  _count: {
    orders: number;
    subscriptions: number;
  };
}

interface UserManagementClientProps {
  currentUserId?: string;
}

export default function UserManagementClient({ currentUserId }: UserManagementClientProps) {
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/users");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch users");
      }

      setUsers(data.users);
    } catch (error: unknown) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: getErrorMessage(error, "Failed to load users"),
        variant: undefined,
        className: "!bg-foreground !text-background !border-foreground",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const toggleAdminStatus = async (userId: string, currentIsAdmin: boolean) => {
    setTogglingUserId(userId);

    try {
      const response = await fetch(
        `/api/admin/users/${userId}/toggle-admin`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isAdmin: !currentIsAdmin }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update admin status");
      }

      // Update local state
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, isAdmin: !currentIsAdmin } : user
        )
      );

      toast({
        title: "Success",
        description: data.message,
        variant: undefined,
        className: "!bg-foreground !text-background !border-foreground",
      });
    } catch (error: unknown) {
      console.error("Error toggling admin status:", error);
      toast({
        title: "Error",
        description: getErrorMessage(error, "Failed to update admin status"),
        variant: undefined,
        className: "!bg-foreground !text-background !border-foreground",
      });
    } finally {
      setTogglingUserId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Users</CardTitle>
        <CardDescription>
          {users.length} total user{users.length !== 1 ? "s" : ""} •{" "}
          {users.filter((u) => u.isAdmin).length} admin
          {users.filter((u) => u.isAdmin).length !== 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Subscriptions</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {user.name || "No name"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      {user.isAdmin ? (
                        <Badge variant="default" className="gap-1">
                          <Shield className="h-3 w-3" />
                          Admin
                        </Badge>
                      ) : (
                        <Badge variant="secondary">User</Badge>
                      )}
                    </TableCell>
                    <TableCell>{user._count.orders}</TableCell>
                    <TableCell>{user._count.subscriptions}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant={user.isAdmin ? "destructive" : "default"}
                        size="sm"
                        onClick={() =>
                          toggleAdminStatus(user.id, user.isAdmin)
                        }
                        disabled={
                          togglingUserId === user.id ||
                          (user.isAdmin && user.id === currentUserId)
                        }
                        title={
                          user.isAdmin && user.id === currentUserId
                            ? "You cannot revoke your own admin privileges"
                            : undefined
                        }
                      >
                        {togglingUserId === user.id ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            {user.isAdmin ? "Revoking..." : "Promoting..."}
                          </>
                        ) : user.isAdmin ? (
                          <>
                            <ShieldOff className="h-3 w-3 mr-1" />
                            Revoke Admin
                          </>
                        ) : (
                          <>
                            <Shield className="h-3 w-3 mr-1" />
                            Make Admin
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
