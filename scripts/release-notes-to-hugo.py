import os
import requests
import json
from datetime import datetime

# Configuration
GITHUB_REPO = "wandb/server"  # Replace with the actual repo (e.g., "torvalds/linux")
OUTPUT_DIR = "../content/posts/releases"  # Hugo content directory
GITHUB_API_URL = f"https://api.github.com/repos/{GITHUB_REPO}/releases"
HEADERS = {"Accept": "application/vnd.github.v3+json"}  # Optional: Add authorization if needed

# Ensure output directory exists
os.makedirs(OUTPUT_DIR, exist_ok=True)

def fetch_releases():
    response = requests.get(GITHUB_API_URL, headers=HEADERS)
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Error: Unable to fetch releases (Status Code: {response.status_code})")
        return []

def format_markdown(release):
    title = release.get("name", release.get("tag_name", "Unknown Release"))
    date = release.get("published_at", "")
    if date:
        date = datetime.strptime(date, "%Y-%m-%dT%H:%M:%SZ").strftime("%Y-%m-%d")
    
    content = release.get("body", "No release notes provided.")
    slug = release.get("tag_name", title.replace(" ", "-").lower())
    
    md_content = f"""
---
title: "{title}"
date: {date}
slug: "{slug}"
draft: false
---

{content}
"""
    return slug, md_content

def save_markdown(slug, content):
    file_path = os.path.join(OUTPUT_DIR, f"{slug}.md")
    with open(file_path, "w", encoding="utf-8") as file:
        file.write(content)
    print(f"Saved: {file_path}")

def main():
    releases = fetch_releases()
    for release in releases:
        slug, md_content = format_markdown(release)
        save_markdown(slug, md_content)

if __name__ == "__main__":
    main()
