const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.deleteExpiredInvites = functions.database.ref('/invites')
    .onWrite(change => {
        const ref = change.after.ref;
        // This sets the cutoff date to two days ago
        const cutoffDate = Date.now() - (2 * 60 * 60 * 24 * 1000);
        // returns invites that are older than 2 days old
        let oldInvites = ref.orderByChild('createdAt').endAt(cutoffDate);
        // updates the database to delete all invites that are invalid
        return oldInvites.once('value', snap => {
            const updates = {};
            snap.forEach(child => {
                updates[child.key] = null
            })
            return ref.update(updates);
        })
    })

exports.updateChangeLog = functions.database.ref('/boardData/{pushId}/{subBoardId}/tasks/{taskId}')
    .onWrite((change, context) => {
        // context.params.[anything in {} up above]
        const { pushId, subBoardId, taskId } = context.params;
        const { uid } = context.auth;
        const changeBefore = change.before.val();
        const changeAfter = change.after.val();
        console.log("before", changeBefore, "after", changeAfter);
        console.log("context", context)
        return admin.database().ref(`/changelog/${pushId}`).push().set({
            subBoardId : subBoardId,
            taskId : taskId,
            user : uid,
            message : `${uid} changed task with tile ${changeAfter.title} in ${subBoardId} at {time goes here}`
        })
    })
