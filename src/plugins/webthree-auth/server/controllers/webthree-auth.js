"use strict";

const { ethers } = require("ethers");
const { ethUtil } = require("ethereumjs-util");
const { sanitize } = require("@strapi/utils");

module.exports = {
  /**
   * Generate auth token and return it
   * @param ctx
   * @returns {Promise<void>}
   */
  async authToken(ctx) {
    // Sanitize address
    const address = strapi
      .plugin("webthree-auth")
      .service("webthreeAuthService")
      .sanitizeAddress(ctx.params.address);
    if (!address) {
      ctx.send({
        success: false,
        error: "Invalid address",
      });
      return;
    }

    // Generate a new token
    const token = strapi
      .plugin("webthree-auth")
      .service("webthreeAuthService")
      .generateToken();

    // Find user by address
    let user = await strapi
      .query("plugin::users-permissions.user")
      .findOne({ where: { address } });

    if (!user) {
      // Create user in database if not exists
      user = await strapi
        .plugin("webthree-auth")
        .service("webthreeAuthService")
        .createUser({
          address,
          username: address,
          confirmed: false,
          blocked: false,
          token: token,
        });
    } else {
      // Update user token in database
      user = await strapi
        .plugin("webthree-auth")
        .service("webthreeAuthService")
        .updateUserToken(address, token);
    }

    // Return token
    ctx.send({ token });
  },

  async authenticate(ctx) {
    // Sanitize address
    const address = strapi
      .plugin("webthree-auth")
      .service("webthreeAuthService")
      .sanitizeAddress(ctx.params.address);
    if (!address) {
      ctx.send({
        success: false,
        error: "Invalid address",
      });
      return;
    }

    // Find user by address
    const user = await strapi
      .query("plugin::users-permissions.user")
      .findOne({ where: { address } });
    if (!user) {
      ctx.send({
        success: false,
        error: "User not found",
      });
      return;
    }

    // Verify signature
    const signatureIsValid = await strapi
      .plugin("webthree-auth")
      .service("webthreeAuthService")
      .verifySignature(address, ctx.params.signature);
    if (!signatureIsValid) {
      ctx.send({
        success: false,
        error: "Invalid signature",
      });
      return;
    }

    // If the user account is not confirmed, update it in database
    if (user.confirmed === false) {
      await strapi
        .plugin("webthree-auth")
        .service("webthreeAuthService")
        .confirmUserByAddress(address);
    }

    // Sanitize user data
    const { jwt: jwtService } = strapi.plugins["users-permissions"].services;
    const userSchema = strapi.getModel("plugin::users-permissions.user");
    const sanitizedUserInfo = await sanitize.sanitizers.defaultSanitizeOutput(
      userSchema,
      user
    );

    // Send JWT token & user data
    ctx.send({
      jwt: jwtService.issue({ id: user.id }),
      user: sanitizedUserInfo,
    });
  },

  async web3authenticate(ctx) {
    const params = ctx.request.body;
    try {
      const message = params.message;
      const signature = params.signature; // The signature in hexadecimal format
      const address = params.address; // The address you want to verify against
      // Convert the signature to a Buffer
      const signatureBuffer = ethUtil.toBuffer(signature);

      // Verify the message
      const messageBuffer = ethUtil.toBuffer(message);
      const messageHash = ethUtil.hashPersonalMessage(messageBuffer);
      const publicKey = ethUtil.ecrecover(
        messageHash,
        signatureBuffer.slice(0, 32),
        signatureBuffer.slice(32, 64)
      );
      const recoveredAddress =
        "0x" + ethUtil.pubToAddress(publicKey).toString("hex");

      if (recoveredAddress.toLowerCase() === address.toLowerCase()) {
        

        
      } else {
        console.log("Message verification failed.");
      }
      ctx.send({
        success: false,
        error: "Invalid address",
      });
      return;
    } catch (error) {
      console.error('Error parsing body:', error);
      ctx.send({
        success: false,
        error: "Invalid data input",
      });
      return;
    }

    /*
    // Sanitize address
    const address = strapi.plugin('webthree-auth').service('webthreeAuthService').sanitizeAddress(ctx.params.address)
    if(!address) {
      ctx.send({
        success: false,
        error: 'Invalid address'
      })
      return
    }

    // Find user by address
    const user = await strapi.query('plugin::users-permissions.user').findOne({where: {address}})
    if(!user) {
      ctx.send({
        success: false,
        error: 'User not found'
      })
      return
    }

    // Verify signature
    const signatureIsValid = await strapi.plugin('webthree-auth').service('webthreeAuthService').verifySignature(address, ctx.params.signature)
    if(!signatureIsValid) {
      ctx.send({
        success: false,
        error: 'Invalid signature'
      })
      return
    }

    // If the user account is not confirmed, update it in database
    if(user.confirmed === false) {
      await strapi.plugin('webthree-auth').service('webthreeAuthService').confirmUserByAddress(address)
    }

    // Sanitize user data
    const { jwt: jwtService } = strapi.plugins['users-permissions'].services
    const userSchema = strapi.getModel('plugin::users-permissions.user')
    const sanitizedUserInfo = await sanitize.sanitizers.defaultSanitizeOutput(userSchema, user)

    // Send JWT token & user data
    ctx.send({
      jwt: jwtService.issue({id: user.id}),
      user: sanitizedUserInfo
    })*/
  },
};
