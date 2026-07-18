const tmi = require("tmi.js");
const config = require("../../config.js");

class TwitchService {
  constructor() {
    this.onMessage = [];
    this.onCommand = [];
    this.client = null;
    this.channel = null;
    this.connected = false;
  }
  getOnlyMessage(message, emote) {
    // // console.log("getsimpleText emote: ["+message+"] emote: ["+emote+"]")
    if (!emote) return message;

    // store all emote keywords
    // ! you have to first scan through
    // the message string and replace later
    const stringReplacements = [];

    // iterate of emotes to access ids and positions

    let emoteTMP = emote.split("/");
    let emotes = [];

    emoteTMP.forEach((e) => emotes.push(e.split(":")));

    // // console.log("##########################EMOTES")
    // // console.log(emotes)

    // // console.log("##########################Working")
    Object.entries(emotes).forEach(([abc, values]) => {
      // use only the first position to find out the emote key word
      const id = values[0];
      const position = values[1];
      const [start, end] = position.split("-");
      const stringToReplace = message.substring(
        parseInt(start, 10),
        parseInt(end, 10) + 1
      );

      stringReplacements.push({
        stringToReplace: stringToReplace,
        replacement: ``,
      });
    });

    // generate HTML and replace all emote keywords with image elements
    const simpleText = stringReplacements.reduce(
      (acc, { stringToReplace, replacement }) => {
        // obs browser doesn't seam to know about replaceAll
        return acc.split(stringToReplace).join();
      },
      message
    );

    return simpleText;
  }

  start = async (username, password, channel) => {
    this.username = username;
    this.password = password;
    this.channel = channel;

    const opts = {
      options: { debug: false },
      identity: {
        username: username,
        password: password,
      },
      channels: [channel],
    };

    this.client = new tmi.client(opts);

    const onMessageHandler = (target, context, msg, self) => {
      if (self) {
        return;
      } // Ignore messages from the bot


      context.simpleMessage = this.getOnlyMessage(msg, context["emotes-raw"])

      this._isWaiting = true;

      if (context.color == null) {
        context.color = "#FFFFFF";
      }
      this.onMessage.forEach((func) => func(msg.trim(), context));

      if (msg.startsWith("!")) {
        let cmdName = msg.split(" ", 2)[0].substr(1);
        cmdName = cmdName.toLowerCase();

        if (this.onCommand[cmdName] != undefined) {
          try {
            this.onCommand[cmdName](msg.trim(), context);
          } catch (error) {
            console.error("TwitchService onCommand ERROR");
            console.error(error);
            error;
          }
        }
      }
    };

    this.client.on("message", onMessageHandler);

    this.client.on("logon", () => {
      setTimeout(() => {
        this.connected = true;
      }, 500);
    });

    await this.client.connect();

    if (config.trace) {
      this.addOnMessage((message, context) => {
        console.log("--------------- onTwitchMessage ---------------");
        console.log("Message [" + message + "]");
        console.log("Context [", context, "]");
        console.log("--------------- --------------- ---------------");
      });
    }
  };

  async reconnectWithToken(newToken) {
    if (!this.client) return;

    console.log("TwitchService : reconnecting with refreshed token");

    this.password = newToken;

    try {
      await this.client.disconnect();
    } catch (err) {
      console.warn("TwitchService: erreur lors du disconnect", err);
    }

    await this.start(this.username, this.password, this.channel);
  }

  
  // fake a msg from twitch
  fakeMsg(msg, context) {

    context.simpleMessage = this.getOnlyMessage(msg, context["emotes-raw"])

    this.onMessage.forEach((func) => func(msg.trim(), context));

    if (msg.startsWith("!")) {
      let cmdName = msg.split(" ", 2)[0].substr(1);
      cmdName = cmdName.toLowerCase();

      if (this.onCommand[cmdName] != undefined) {
        try {
          this.onCommand[cmdName](msg.trim(), context);
        } catch (error) {
          console.error("TwitchService onCommand ERROR");
          console.error(error);
          error;
        }
      }
    }
  }

  addOnMessage(onMessage) {
    this.onMessage.push(onMessage);
  }

  addOnCommand(command, handler) {
    command = command.toLowerCase();
    this.onCommand[command] = handler;
  }

  whisper(userName, message) {
    if (this.connected == false) {
      console.log(
        "TwitchService : Waiting client is not ready (" +
          this.client.readyState() +
          ")"
      );
      setTimeout(() => {
        this.whisper(userName, message);
      }, 1000);

      return;
    } else {
      this.client
        .whisper(userName, message)
        .then(function (data) {
          console.log(
            "TwitchService : ----> Wisper to [" + userName + "] : " + message
          );
          //console.log('TwitchService : ---->', data);
        })
        .catch(function (err) {
          console.warn(
            "TwitchService : ----> NO WISPER to [" + userName + "] : " + message
          );
          console.warn("TwitchService : ---->", err);
        });
    }
  }

  say(message) {
    // dealing no connected
    if (this.connected == false) {
      console.log(
        "TwitchService : Waiting client is not ready (" +
          this.client.readyState() +
          ")"
      );
      setTimeout(() => {
        this.say(message);
      }, 1000);

      return;
    } else {
      console.log("TwitchService : ----> Tchat : " + message);
      this.client.say(this.channel, message);
    }
  }
}

module.exports = TwitchService;
