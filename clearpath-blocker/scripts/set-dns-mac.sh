#!/bin/bash
# Sets CleanBrowsing Adult Filter DNS on all network services (macOS).
# Run: sudo bash set-dns-mac.sh
# Undo: sudo networksetup -setdnsservers "Wi-Fi" empty   (repeat per service)

set -e
DNS="185.228.168.10 185.228.169.11"

networksetup -listallnetworkservices | tail -n +2 | while read -r service; do
  echo "Setting filtered DNS on: $service"
  networksetup -setdnsservers "$service" $DNS || true
done

dscacheutil -flushcache && killall -HUP mDNSResponder || true
echo "Done. Adult content is now filtered at the DNS level on this Mac."
echo "Test it: https://cleanbrowsing.org/filters/ should confirm the Adult Filter is active."
