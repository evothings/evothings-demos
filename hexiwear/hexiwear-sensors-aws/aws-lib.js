evothings.aws = evothings.aws || {}

/**
 * Initialize AWS Lambda.
 * @param config Object with configuration parameters,
 * see file aws-config.js
 */
evothings.aws.initialize = function(config)
{
	evothings.aws.lambda = new AWS.Lambda(config)
}

/**
 * Update a sensor.
 * @param sensorid ID of the sensor
 * @param value Value of the sensor
 * @param success Success callback: success()
 * @param error Error callback: success(err)
 */
evothings.aws.update = function(sensorid, value, success, error)
{
	var params = {
      	Payload: JSON.stringify({
      		operation: 'update',
      		sensorid: sensorid,
      		value: value })
    	}
    evothings.aws.lambda.invoke(
    	params,
    	function(err, data) {
			if (err) {
      			error && error(err)
      		}
			else {
      			success && success(data)
      		}
      	}
    )
}

/**
 * Query a sensor.
 * @param sensorid ID of the sensor
 * @param success Success callback: success(items)
 *   (item fields: item.Timestamp, item.Value)
 * @param error Error callback: success(err)
 */
evothings.aws.query = function(sensorid, success, error)
{
	var params = {
      	Payload: JSON.stringify({
      		operation: 'query',
      		sensorid: sensorid })
    	}
    evothings.aws.lambda.invoke(
    	params,
    	function(err, data) {
			if (err) {
      			error && error(err)
      		}
			else {
                var items = JSON.parse(data.Payload).Items
      			success && success(items)
      		}
      	}
    )
}
