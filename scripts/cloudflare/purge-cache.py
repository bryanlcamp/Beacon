#!/usr/bin/env python3
import requests
import os

# Set your API token here or use an environment variable for security
API_TOKEN = os.environ.get('CF_API_TOKEN')
if not API_TOKEN:
    print('ERROR: Cloudflare API token not set. Please set the CF_API_TOKEN environment variable.')
    exit(1)

# beaconhft.com domain - hardcoded for simplicity
DOMAIN = 'beaconhft.com'

headers = {
    'Authorization': f'Bearer {API_TOKEN}',
    'Content-Type': 'application/json'
}

# Step 1: Get zone ID for beaconhft.com
print('Getting zone ID for beaconhft.com...')
zones_url = 'https://api.cloudflare.com/client/v4/zones'
resp = requests.get(zones_url, headers=headers)

if resp.status_code != 200:
    print(f'ERROR: Failed to get zones: {resp.status_code} - {resp.text}')
    exit(1)

zones = resp.json().get('result', [])
zone_id = None

for zone in zones:
    if zone['name'] == DOMAIN:
        zone_id = zone['id']
        break

if not zone_id:
    print(f'ERROR: Zone not found for domain {DOMAIN}')
    exit(1)

print(f'Found zone ID: {zone_id}')

# Step 2: Purge all cache for the zone
print('Purging all cache...')
purge_url = f'https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache'
purge_data = {'purge_everything': True}

resp = requests.post(purge_url, headers=headers, json=purge_data)

if resp.status_code == 200:
    print('✅ Cache purged successfully!')
    print('All cached content for beaconhft.com has been cleared.')
else:
    print(f'❌ ERROR: Failed to purge cache: {resp.status_code} - {resp.text}')
    exit(1)
