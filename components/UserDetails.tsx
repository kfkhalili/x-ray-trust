"use client";

import { UserInfo } from "@/types/trust";
import {
  Calendar,
  Users,
  UserPlus,
  Verified,
  ExternalLink,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface UserDetailsProps {
  userInfo: UserInfo;
}

/**
 * Account identity card for visual verification.
 *
 * Profile picture, name, and stats let users quickly confirm they're
 * looking at the right account before consuming the trust score.
 * Clickable username links to X for manual verification if desired.
 */
export const UserDetails = ({ userInfo }: UserDetailsProps) => {
  const accountAge = formatDistanceToNow(new Date(userInfo.createdAt), {
    addSuffix: false,
  });
  const accountAgeYears = Math.floor(
    (new Date().getTime() - new Date(userInfo.createdAt).getTime()) /
      (1000 * 60 * 60 * 24 * 365)
  );

  const formatNumber = (num?: number): string => {
    if (!num && num !== 0) return "N/A";
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 backdrop-blur-sm mb-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Profile Picture */}
        <div className="shrink-0">
          {userInfo.profilePicture ? (
            <img
              src={userInfo.profilePicture}
              alt={userInfo.name}
              className="w-20 h-20 rounded-full border-2 border-gray-700"
              onError={(e) => {
                // Fallback to default avatar if image fails to load
                (
                  e.target as HTMLImageElement
                ).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  userInfo.name
                )}&background=10b981&color=fff&size=128`;
              }}
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-gray-700 flex items-center justify-center">
              <span className="text-2xl font-bold text-emerald-400">
                {userInfo.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="flex-1 space-y-4">
          {/* Name and Username */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-bold text-gray-100">
                {userInfo.name}
              </h2>
              {userInfo.blueVerified && (
                <Verified
                  className="w-5 h-5 text-blue-400"
                  fill="currentColor"
                />
              )}
            </div>
            <div className="flex items-center gap-2">
              <a
                href={`https://twitter.com/${userInfo.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-emerald-400 transition-colors flex items-center gap-1">
                <span>@{userInfo.username}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            {userInfo.description && (
              <p className="text-gray-300 text-sm mt-2 line-clamp-2">
                {userInfo.description}
              </p>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Followers */}
            <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
              <div className="flex items-center gap-2 text-gray-400 mb-1">
                <Users className="w-4 h-4" />
                <span className="text-xs font-medium">Followers</span>
              </div>
              <p className="text-lg font-semibold text-gray-100">
                {formatNumber(userInfo.followersCount)}
              </p>
            </div>

            {/* Following */}
            <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
              <div className="flex items-center gap-2 text-gray-400 mb-1">
                <UserPlus className="w-4 h-4" />
                <span className="text-xs font-medium">Following</span>
              </div>
              <p className="text-lg font-semibold text-gray-100">
                {formatNumber(userInfo.followingCount)}
              </p>
            </div>

            {/* Account Age */}
            <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
              <div className="flex items-center gap-2 text-gray-400 mb-1">
                <Calendar className="w-4 h-4" />
                <span className="text-xs font-medium">Age</span>
              </div>
              <p className="text-lg font-semibold text-gray-100">
                {accountAgeYears > 0
                  ? `${accountAgeYears}y`
                  : accountAge.split(" ")[0]}
              </p>
            </div>

            {/* Verified Status */}
            <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
              <div className="flex items-center gap-2 text-gray-400 mb-1">
                <Verified className="w-4 h-4" />
                <span className="text-xs font-medium">Status</span>
              </div>
              <p className="text-lg font-semibold text-gray-100">
                {userInfo.blueVerified ? "Verified" : "Unverified"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
