"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { User, Shield, Link2, MapPin, Trash2 } from "lucide-react";
import ProfileTab from "./tabs/ProfileTab";
import SecurityTab from "./tabs/SecurityTab";
import ConnectedAccountsTab from "./tabs/ConnectedAccountsTab";
import AddressesTab from "./tabs/AddressesTab";
import DangerZoneTab from "./tabs/DangerZoneTab";

interface Address {
  id: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

interface Account {
  provider: string;
  providerAccountId: string;
}

interface UserData {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  passwordHash: string | null;
  addresses: Address[];
  accounts: Account[];
}

interface AccountPageClientProps {
  user: UserData;
}

/**
 * Account Settings Client Component
 *
 * Features:
 * - Profile management (name, email)
 * - Security settings (change password)
 * - Connected OAuth accounts
 * - Address book management
 * - Order history
 * - Account deletion
 */
export default function AccountPageClient({ user }: AccountPageClientProps) {
  const [userData, setUserData] = useState(user);

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-base mb-2">
          Account Settings
        </h1>
        <p className="text-text-muted">
          Manage your profile, security, and preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="accounts" className="flex items-center gap-2">
            <Link2 className="w-4 h-4" />
            <span className="hidden sm:inline">Accounts</span>
          </TabsTrigger>
          <TabsTrigger value="addresses" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span className="hidden sm:inline">Addresses</span>
          </TabsTrigger>
          <TabsTrigger
            value="danger"
            className="flex items-center gap-2 text-red-600"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Delete</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileTab user={userData} onUpdate={setUserData} />
        </TabsContent>

        <TabsContent value="security">
          <SecurityTab hasPassword={!!userData.passwordHash} />
        </TabsContent>

        <TabsContent value="accounts">
          <ConnectedAccountsTab accounts={userData.accounts} />
        </TabsContent>

        <TabsContent value="addresses">
          <AddressesTab
            addresses={userData.addresses}
            userId={userData.id}
            onUpdate={(addresses: Address[]) =>
              setUserData({ ...userData, addresses })
            }
          />
        </TabsContent>

        <TabsContent value="danger">
          <DangerZoneTab userId={userData.id} userEmail={userData.email} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
