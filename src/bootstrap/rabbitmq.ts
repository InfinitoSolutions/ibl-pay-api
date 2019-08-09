const amqplib = require('amqplib');
const { RABBITMQ_HOST, RABBITMQ_USER, RABBITMQ_PASS } = process.env;

let connection = undefined;

export const connect = () => {
	const url = `amqp://${RABBITMQ_USER}:${RABBITMQ_PASS}@${RABBITMQ_HOST}`;
	console.log(url);
	return amqplib.connect(url);
};

export const send = async (queueName: any, message: any) => {
	if (!connection) {
		connection = await connect();
	}
	return connection
		.createChannel()
		.then(channel => {
			return channel
				.assertQueue(queueName, { durable: true })
				.then(() => {
					channel.sendToQueue(queueName, Buffer.from(message), {
						deliveryMode: true
					});
					console.log('[x] Sent ', message);
					return channel.close();
				});
		})
	.catch(error => {
		console.log(error);
	});
};
