"use strict";
const socketIO = require("socket.io");

module.exports = {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/*{ strapi }*/) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  bootstrap({ strapi }) {
    let interval;
    var io = socketIO(strapi.server.httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    io.use(async (socket, next) => {
      try {
        //Socket Authentication
        const result = await strapi.plugins[
          "users-permissions"
        ].services.jwt.verify(socket.handshake.query.token);

        //Save the User ID to the socket connection
        socket.user = result.id;
        next();
      } catch (error) {
        console.log(error);
      }
    }).on("connection", function (socket) {
      if (interval) {
        clearInterval(interval);
      }

      console.log("a user connected");
      interval = setInterval(() => {
        io.emit("serverTime", { time: new Date().getTime() }); // This will emit the event to all connected sockets
      }, 1000);

      socket.on("join", async (data_join) => {
        let params = data_join;
        const netItem = {
          data: {
            campaign_id: params.id + "",
            address: params.address,
            socket_id: socket.id + "",
          },
        };
        try {
          const entries = await strapi.entityService.findMany(
            "api::participan.participan",
            {
              fields: ["id"],
              filters: { campaign_id: params.id + "", address: params.address },
            }
          );
          if (!entries.length) {
            socket.emit(
              "joined",
              await strapi.entityService.findMany(
                "api::participan.participan",
                {
                  fields: ["address"],
                  filters: { campaign_id: params.id + "" },
                }
              )
            );
            await strapi.service("api::participan.participan").create(netItem);
            socket.join("camp_" + params.id);
            io.to("camp_" + params.id).emit("join", { id: params.address });
          } else {
            socket.emit("duplicated", "address is registered");
            socket.disconnect();
          }
        } catch (error) {
          console.log(error);
        }
      });

      socket.on("start", async (data) => {
        let params = data;
        try {
          let found = await strapi.entityService.findOne(
            "api::round.round",
            params.id + "",
            { fields: "enough_participants" }
          );
          io.to("camp_" + params.id).emit("letstart", {
            startable: found.enough_participants,
          });
        } catch (error) {
          console.log(error);
        }
      });

      socket.on("doResult", async (data) => {
        const entries = await strapi.entityService.findMany(
          "api::result.result",
          {
            fields: ["id"],
            filters: {
              campaign_id: data.campaign_id,
              round_id: data.round_id,
              user: data.user,
            },
          }
        );

        if (entries.length) {
          entries.forEach((element) => {
            strapi.entityService.update("api::result.result", element.id, {
              data: {
                publishedAt: new Date(),
                date: "${new Date().toISOString()}",
                updatedAt: new Date(),
                answer: data.answer,
                score : data.score,
              },
            });
          });
        } else {
          const netItem = {
            data: {
              campaign_id:  data.campaign_id + "",
              user: data.user,
              round_id: data.round_id + "",
              score : data.score,
              answer: data.answer,
            },
          };
          await strapi.service("api::result.result").create(netItem);
        }
      });

      socket.on("disconnect", async () => {
        console.log("user disconnected: " + socket.id);
        try {
          const netItem = {
            socket_id: socket.id + "",
          };

          const rooms = Object.keys(socket.rooms);

          // Leave all rooms
          rooms.forEach((room) => {
            socket.leave(room);
            console.log(`User left room: ${room}`);
          });
          const entries = await strapi.entityService.findMany(
            "api::participan.participan",
            {
              fields: ["id", "address", "campaign_id"],
              filters: { socket_id: socket.id + "" },
            }
          );
          entries.forEach((element) => {
            io.to("camp_" + element.campaign_id).emit("unjoin", {
              id: element.address,
            });
            strapi
              .service("api::participan.participan")
              .delete(element.id + "");
          });
        } catch (error) {
          console.log(error);
        }
        clearInterval(interval);
      });
    });

    strapi.io = io;
  },
};
