# use the Alpine Linux to keep our image size down
FROM node:18-alpine

# By default, the Docker Node image includes a non-root node user
# that you can use to avoid running your application container as root.
# It is a recommended security practice to avoid running containers as root
# and to restrict capabilities within the container to only those required to run its processes.
RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app

# We will therefore use the node user's home directory as the working directory for our application
# and set them as our user inside the container
WORKDIR /home/node/app

# copy application code with the appropriate permissions to the application directory on the container
COPY --chown=node:node /dist .

# copy some json data to the container, to have at least one dataset of mock data
COPY --chown=node:node /mock-db ./mock-db

# don't forget to copy the installed packages to successfully run the application
# of course, this should be done first in a build step of the CI/CD
COPY --chown=node:node /node_modules ./node_modules

# does not publish the port,
# but instead functions as a way of documenting which ports on the container will be published at runtime
EXPOSE 3000

# finally start the application
CMD [ "node", "main.js" ]
