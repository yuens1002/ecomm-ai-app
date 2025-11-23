"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  Github,
} from "lucide-react";

interface SocialLink {
  id: string;
  platform: string;
  url: string;
  icon: string;
  order: number;
  isActive: boolean;
}

const SOCIAL_PLATFORMS = [
  { value: "facebook", label: "Facebook", icon: Facebook },
  { value: "twitter", label: "Twitter/X", icon: Twitter },
  { value: "instagram", label: "Instagram", icon: Instagram },
  { value: "linkedin", label: "LinkedIn", icon: Linkedin },
  { value: "youtube", label: "YouTube", icon: Youtube },
  { value: "github", label: "GitHub", icon: Github },
];

export default function SocialLinksManagement() {
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<SocialLink | null>(null);
  const [formData, setFormData] = useState({
    platform: "",
    url: "",
    icon: "",
    order: 0,
    isActive: true,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchSocialLinks();
  }, []);

  const fetchSocialLinks = async () => {
    try {
      const response = await fetch("/api/admin/social-links");
      if (!response.ok) throw new Error("Failed to fetch social links");
      const data = await response.json();
      setSocialLinks(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load social links",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingLink
        ? `/api/admin/social-links/${editingLink.id}`
        : "/api/admin/social-links";
      const method = editingLink ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to save social link");

      toast({
        title: "Success",
        description: `Social link ${editingLink ? "updated" : "created"} successfully`,
      });

      setIsDialogOpen(false);
      resetForm();
      fetchSocialLinks();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save social link",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this social link?")) return;

    try {
      const response = await fetch(`/api/admin/social-links/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete social link");

      toast({
        title: "Success",
        description: "Social link deleted successfully",
      });

      fetchSocialLinks();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete social link",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (link: SocialLink) => {
    try {
      const response = await fetch(`/api/admin/social-links/${link.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !link.isActive }),
      });

      if (!response.ok) throw new Error("Failed to update social link");

      fetchSocialLinks();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update social link",
        variant: "destructive",
      });
    }
  };

  const openDialog = (link?: SocialLink) => {
    if (link) {
      setEditingLink(link);
      setFormData({
        platform: link.platform,
        url: link.url,
        icon: link.icon,
        order: link.order,
        isActive: link.isActive,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingLink(null);
    setFormData({
      platform: "",
      url: "",
      icon: "",
      order: socialLinks.length,
      isActive: true,
    });
  };

  const getPlatformIcon = (icon: string) => {
    const platform = SOCIAL_PLATFORMS.find((p) => p.value === icon);
    return platform ? platform.icon : Facebook;
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Social Media Links</CardTitle>
            <CardDescription>
              Manage social media links displayed in the footer
            </CardDescription>
          </div>
          <Button onClick={() => openDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            Add Link
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {socialLinks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No social links yet. Click &quot;Add Link&quot; to get started.
            </p>
          ) : (
            socialLinks.map((link) => {
              const Icon = getPlatformIcon(link.icon);
              return (
                <div
                  key={link.id}
                  className="flex items-center gap-4 p-4 border rounded-lg"
                >
                  <GripVertical className="w-5 h-5 text-muted-foreground" />
                  <Icon className="w-5 h-5" />
                  <div className="flex-1">
                    <p className="font-medium">{link.platform}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {link.url}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={link.isActive}
                      onCheckedChange={() => handleToggleActive(link)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openDialog(link)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(link.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingLink ? "Edit" : "Add"} Social Link
                </DialogTitle>
                <DialogDescription>
                  {editingLink
                    ? "Update the social media link details"
                    : "Add a new social media link to the footer"}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="platform">Platform</Label>
                  <Select
                    value={formData.platform}
                    onValueChange={(value) => {
                      setFormData({
                        ...formData,
                        platform: value,
                        icon: value,
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      {SOCIAL_PLATFORMS.map((platform) => (
                        <SelectItem key={platform.value} value={platform.value}>
                          {platform.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="url">URL</Label>
                  <Input
                    id="url"
                    type="url"
                    placeholder="https://..."
                    value={formData.url}
                    onChange={(e) =>
                      setFormData({ ...formData, url: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="order">Display Order</Label>
                  <Input
                    id="order"
                    type="number"
                    value={formData.order}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        order: parseInt(e.target.value),
                      })
                    }
                    required
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked: boolean) =>
                      setFormData({ ...formData, isActive: checked })
                    }
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingLink ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
