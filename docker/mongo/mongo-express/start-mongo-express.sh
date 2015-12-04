docker run \
       -t \
       -rm \
       -p 8081:8081 \
       --name mongo-express \
       --link $1:mongodb \
       mongo-express
