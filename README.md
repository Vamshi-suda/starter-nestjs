<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/pnpm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/pnpm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/pnpm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

### 📚 Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

This boilerplate is made to quickly prototype backend applications. It comes with database, logging, security, and authentication features out of the box.

---

### 🛠️ Prerequisites

#### Non Docker

- Please make sure to either have MongoDB Community installed locally or a subscription to Mongo on the cloud by configuration a cluster in [atlas](https://www.mongodb.com/cloud/atlas).

#### Docker 🐳

- Please make sure to have docker desktop setup on any preferred operating system to quickly compose the required dependencies. Then follow the docker procedure outlined below.

**Note**: Docker Desktop comes free on both Mac and Windows, but it only works with Windows 10 Pro. A workaround is to get [Docker Toolbox](https://docs.docker.com/toolbox/toolbox_install_windows/) which will bypass the Windows 10 Pro prerequisite by executing in a VM.

---

### 🚀 Deployment

#### Manual Deployment without Docker

- Create a `.env` file using the `cp .env.example .env` command and replace the existing env variables with personal settings (MongoDB URL either `srv` or `localhost`)

  - Modify the connection string by modifying the following [line](/.env.example#L10).

- Download dependencies using `pnpm i` or `yarn`

- Start the app in pre-production mode using `pnpm run start` or `pnpm run start:dev` for development (the app will be exposed on the port 9000; not to conflict with React, Angular, or Vue)

#### Deploying with Docker 🐳

- Execute the following command in-app directory:

```bash
# creates and loads the docker container with required configuration
$ docker-compose up -d
```

- The following command will set up and run the docker project for quick use. Then the web application, and MongoDB will be exposed to <http://localhost:9000> and <http://localhost:27017> respectively.

### 🔒 Environment Configuration

By default, the application comes with a config module that can read in every environment variable from the `.env` file.

**APP_ENV** - the application environment to execute as, either in development or production. Determines the type of logging options to utilize. Options: `dev` or `prod`.

**APP_URL** - the base URL for the application. Made mainly to showcase the power of `ConfigService` and can be removed as it doesn't serve any other purpose

**WEBTOKEN_SECRET_KEY** - the secret key to encrypt/decrypt web tokens with. Make sure to generate a random alphanumeric string for this.

**WEBTOKEN_EXPIRATION_TIME** - **the time in seconds** indicating when the web token will expire; by default, it's 2400 seconds which is 40 mins.

**DB_URL** - the URL to the MongoDB collection

---

### 🏗 Choosing a Web Framework

This boilerplate comes with [Fastify](https://github.com/fastify/fastify) out of the box as it offers [performance benefits](https://github.com/nestjs/nest/blob/master/benchmarks/all_output.txt) over Express. But this can be changed to use [Express](https://expressjs.com/) framework instead of Fastify.

**Note**: The boilerplate comes with production dependencies for both Express and Fastify to support moving between two. But this is going to leave it bloated especially when only **one web framework is used at a time**. Thus, **it is recommended that when deploying to production, unused dependencies are purged.**

---

### ✅ Testing

#### Docker 🐳

```bash
# unit tests
$ docker exec -it nest pnpm test

# e2e tests
$ docker exec -it nest pnpm test:e2e

# test coverage
$ docker exec -it nest pnpm test:cov
```

#### Non-Docker

```bash
# unit tests
$ pnpm run test

# e2e tests
$ pnpm run test:e2e

# test coverage
$ pnpm run test:cov
```

---

### 💡 TypeDocs

The docs can be generated on-demand, simply, by typing `pnpm run typedocs`. This will produce a **docs** folder with the required front-end files and **start hosting on [localhost](http://localhost:8080)**.

```bash
# generate docs for code
$ pnpm run typedocs
```

---

### 📝 Open API

Out of the box, the web app comes with Swagger; an [open api specification](https://swagger.io/specification/), that is used to describe RESTful APIs. Nest provides a [dedicated module to work with it](https://docs.nestjs.com/recipes/swagger).

The configuration for Swagger can be found at this [location](src/swagger).

---

### ✨ Mongoose

Mongoose provides a straight-forward, schema-based solution to model your application data. It includes built-in type casting, validation, query building, business logic hooks and more, out of the box. Please view the [documentation](https://mongoosejs.com) for further details.

The configuration for Mongoose can be found in the [app module](/src/modules/app/app.module.ts#L17).

---

### 🔊 Logs

This boilerplate comes with an integrated Winston module for logging, the configurations for Winston can be found in the [app module](/src/modules/app/app.module.ts#L27).

---

### 👥 Support

Nest has been able to grown because of sponsors and support from backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

---

## License

Nest is [MIT licensed](LICENSE).

[Author](https://github.com/nikhilgoud)
