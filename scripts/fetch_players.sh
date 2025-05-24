#!/bin/bash

# API credentials and parameters
API_KEY="08d28d14ccb5483eeaf6d28243fa6879"  # Replace with your actual API key
SEASON="2024"
LEAGUE="1"
BASE_URL="https://v1.american-football.api-sports.io"

# Ensure jq is installed
if ! command -v jq >/dev/null 2>&1; then
  echo "Error: jq is required but not installed. Install with 'sudo apt install jq' or 'brew install jq'."
  exit 1
fi

# Set up output file
output_file="players_$SEASON.json"
temp_file="$output_file.tmp"
echo "[]" > "$output_file"

# Fetch teams
echo "Fetching teams for season $SEASON, league $LEAGUE..."
teams=$(curl -s -H "x-apisports-key: $API_KEY" "$BASE_URL/teams?season=$SEASON&league=$LEAGUE")

# Log raw response for debugging
echo "$teams" > teams_response.log
echo "Raw teams response saved to teams_response.log for debugging."

# Check if response is valid JSON and contains errors
if ! echo "$teams" | jq . >/dev/null 2>&1; then
  echo "Error: API response is not valid JSON. Check teams_response.log."
  exit 1
fi
if echo "$teams" | jq -e '.errors | length > 0' >/dev/null; then
  echo "Error fetching teams: $(echo "$teams" | jq '.errors')"
  exit 1
fi

# Extract team count
team_count=$(echo "$teams" | jq '.response | length')
echo "Found $team_count teams."

# Extract team IDs and names
team_data=$(echo "$teams" | jq -r '.response[] | [.id, .name] | join("\t")')
if [ -z "$team_data" ]; then
  echo "Error: No team data extracted. Check teams_response.log."
  exit 1
fi

# Fetch players for each team
while IFS=$'\t' read -r team_id team_name; do
  # Validate team_id
  if [ -z "$team_id" ]; then
    echo "Error: Invalid team_id for team $team_name"
    continue
  fi

  echo "Fetching players for team ID $team_id ($team_name)..."
  players=$(curl -s -H "x-apisports-key: $API_KEY" "$BASE_URL/players?team=$team_id&season=$SEASON")

  # Log raw players response
  echo "$players" > "players_response_team_$team_id.log"

  # Check for API errors
  if echo "$players" | jq -e '.errors | length > 0' >/dev/null; then
    echo "Error fetching players for team $team_id: $(echo "$players" | jq '.errors')"
    continue
  fi

  player_count=$(echo "$players" | jq '.response | length')
  echo "Found $player_count players for team $team_id."

  # Add team info to player data and append to output
  player_array=$(echo "$players" | jq --arg team_id "$team_id" --arg team_name "$team_name" \
    '[.response[] | . + {team_id: $team_id, team_name: $team_name}]')
  jq --argjson new_players "$player_array" '. + $new_players' "$output_file" > "$temp_file"
  if [ $? -eq 0 ] && [ -s "$temp_file" ]; then
    mv "$temp_file" "$output_file"
  else
    echo "Error: Failed to update $output_file for team $team_id."
    rm -f "$temp_file"
    continue
  fi

  sleep 2  # Avoid rate limits
done <<< "$team_data"

echo "Player data saved to $output_file."