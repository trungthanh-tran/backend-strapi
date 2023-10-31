module.exports = ({ env }) => ({
    // ...
    upload: {
      config: {
        provider: 'strapi-provider-upload-image',
        providerOptions: {
          sizeLimit: 200000,
          minHeight: 100,
          minWidth:100
        },
      },
    },
    // ...
  });