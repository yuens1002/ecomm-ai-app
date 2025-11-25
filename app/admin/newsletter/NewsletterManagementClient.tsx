"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Search,
  Download,
  Mail,
  Users,
  UserCheck,
  UserX,
} from "lucide-react";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldTitle,
} from "@/components/ui/field";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Subscriber {
  id: string;
  email: string;
  subscribedAt: string;
  isActive: boolean;
}

interface SubscriberStats {
  total: number;
  active: number;
  inactive: number;
}

export default function NewsletterManagementClient() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [stats, setStats] = useState<SubscriberStats>({
    total: 0,
    active: 0,
    inactive: 0,
  });
  const [searchQuery, setSearchQuery] = useState("");

  const fetchSubscribers = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/newsletter");
      if (!response.ok) throw new Error("Failed to fetch subscribers");

      const data = await response.json();
      setSubscribers(data.subscribers);
      setStats(data.stats);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load newsletter subscribers",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSubscribers();
  }, [fetchSubscribers]);

  const filteredSubscribers = subscribers.filter((subscriber) =>
    subscriber.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const exportToCSV = () => {
    const csv = [
      ["Email", "Subscribed At", "Status"].join(","),
      ...filteredSubscribers.map((sub) =>
        [
          sub.email,
          new Date(sub.subscribedAt).toLocaleDateString(),
          sub.isActive ? "Active" : "Inactive",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `newsletter-subscribers-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: `Exported ${filteredSubscribers.length} subscribers`,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <FieldTitle className="text-sm font-medium">
              Total Subscribers
            </FieldTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All time signups</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <FieldTitle className="text-sm font-medium">
              Active Subscribers
            </FieldTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.active}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0
                ? `${Math.round((stats.active / stats.total) * 100)}% active`
                : "No subscribers"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <FieldTitle className="text-sm font-medium">
              Unsubscribed
            </FieldTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">
              {stats.inactive}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0
                ? `${Math.round((stats.inactive / stats.total) * 100)}% churned`
                : "No unsubscribes"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Subscriber List */}
      <Card>
        <CardHeader className="pb-8">
          <Field orientation="vertical">
            <FieldContent>
              <FieldTitle className="text-base font-semibold flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Subscriber List
              </FieldTitle>
              <FieldDescription>
                View and manage all newsletter subscribers
              </FieldDescription>
            </FieldContent>
          </Field>

          <div className="flex items-center gap-4 mt-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              onClick={exportToCSV}
              variant="outline"
              className="shrink-0"
              disabled={filteredSubscribers.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredSubscribers.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchQuery
                  ? "No subscribers found matching your search"
                  : "No subscribers yet"}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Subscribed At</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubscribers.map((subscriber) => (
                    <TableRow key={subscriber.id}>
                      <TableCell className="font-medium">
                        {subscriber.email}
                      </TableCell>
                      <TableCell>
                        {new Date(subscriber.subscribedAt).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }
                        )}
                      </TableCell>
                      <TableCell>
                        {subscriber.isActive ? (
                          <Badge variant="default" className="bg-green-600">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
