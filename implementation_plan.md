# precise_friend_request_system.md

## Objective
Implement a robust, mutual friend request system ("Send Request", "Accept", "Decline") replacing the current unilateral "Add Friend" logic. Ensure notifications work seamlessly in-game and out-of-game.

## Architecture

### 1. Data Model
*   **FriendRequest** (already added to types):
    *   `id`: string
    *   `fromUserId`: string
    *   `toUserId`: string
    *   `status`: 'pending' | 'accepted' | 'declined'
    *   `createdAt`: number

### 2. Backend (Firebase Realtime Database & Cloud Functions)
*   **Database Path**: `friendRequests/{requestId}`
*   **Service Layer (`FriendsService.ts`)**:
    *   `sendFriendRequest(toUserId)`: Creates a pending request.
    *   `getFriendRequests()`: Fetches incoming pending requests.
    *   `acceptFriendRequest(requestId)`: Updates status to 'accepted'.
    *   `declineFriendRequest(requestId)`: Updates status to 'declined'.
*   **Cloud Functions (`functions/src/index.ts`)**:
    *   `onFriendRequestCreated`: Triggered on new request. Sends push notification to `toUserId`.
    *   `onFriendRequestStatusChanged`: Triggered when status becomes `accepted`.
        *   Adds `fromUserId` to `toUserId`'s friend list.
        *   Adds `toUserId` to `fromUserId`'s friend list.
        *   Sends "Friend Request Accepted" notification to `fromUserId`.

### 3. Security Rules (`database.rules.json`)
*   `friendRequests`:
    *   `create`: Auth user is `fromUserId`.
    *   `update`: Auth user is `toUserId` (can only update status).
    *   `read`: Auth user is sender or receiver.

### 4. UI Components
*   **FriendsPanel.tsx**:
    *   Add a "Requests" section/tab to display incoming requests.
    *   Accept/Decline buttons for each request.
*   **ProfileCardModal.tsx**:
    *   Replace direct "Add Friend" with "Send Request".
    *   Handle "Request Pending" state.
*   **Toast / Notifications**:
    *   In-game Toast for "New Friend Request" with "View" action (opens FriendsPanel).

## Implementation Steps

1.  **Service Layer**: Update `FriendsService` with new methods (handling the file edit carefully).
2.  **Database Rules**: Update `database.rules.json` for `friendRequests`.
3.  **Cloud Functions**: Implement logic for notifications and mutual friending on acceptance.
4.  **UI Updates**: Modify `FriendsPanel` and `ProfileCardModal`.
5.  **Client Notifications**: Update `App.tsx` to handle `friend_request` notification type.
