#!/usr/bin/env python3
import requests
import os

# Set your API token here or use an environment variable for security
API_TOKEN = os.environ.get('CF_API_TOKEN')
if not API_TOKEN or API_TOKEN == 'YOUR_CLOUDFLARE_API_TOKEN':
    print('ERROR: Cloudflare API token not set. Please set the CF_API_TOKEN environment variable.')
    exit(1)

headers = {
    'Authorization': f'Bearer {API_TOKEN}',
    'Content-Type': 'application/json'
}

url = 'https://api.cloudflare.com/client/v4/zones'

print('Fetching Cloudflare zones...')
resp = requests.get(url, headers=headers)
if resp.status_code == 400 and 'Invalid format for Authorization header' in resp.text:
    print('ERROR: Invalid for mat for Authorization header. Make sure your API token is correct and set as CF_API_TOKEN.')
    exit(1)
elif resp.status_code != 200:
    print(f'ERROR: {resp.status_code} - {resp.text}')
    exit(1)

zones = resp.json().get('result', [])
if not zones:
    print('No zones found or invalid API token.')
    exit(1)

print('\nYour Cloudflare Zones:')
for z in zones:
    print(f"Domain: {z['name']}\nZone ID: {z['id']}\n")
