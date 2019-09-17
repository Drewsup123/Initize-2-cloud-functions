const functions = require('firebase-functions');
const admin = require('firebase-admin');
const mailgun = require('mailgun-js') //This will be used later
const mg = mailgun({apiKey : "fake key", domain : "www.initize.com"});
const WelcomeEmail = require('./WelcomeEmail');
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

    exports.sendWelcomeEmail = functions.database.ref('users/{uid}').onWrite(event => {
        // only trigger for new users [event.data.previous.exists()]
        // do not trigger on delete [!event.data.exists()]
        console.log(event)
        if (!(event.before.val() === null)) {
            console.log("email not sent")
            return("email not sent");
        }
        const user = event.after.val();
        const { email, username } = user
        const data = {
            from: 'Drew <drew@initize.com>',
            subject: `Welcome To Initize ${username}!`,
            text: "Remember this application is still in development so please keep that in mind if you run across any bugs or inconveniences. Please don't respond to this email yet as I don't have email routing set up so I won't get it.",
            to: `${email}, drewsup123c@gmail.com`
        }
        mg.messages().send(data, function (error, body) {
            console.log("email body", body)
            if(error){
                console.log("Error from MG", error);
            }
        })
        console.log("email should have been sent")
        return("Email Sent")
    })
    //This function will be used later probably won't use mailgun
