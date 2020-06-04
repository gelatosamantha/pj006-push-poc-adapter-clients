/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/**
 * Solace Web Messaging API for JavaScript
 * Publish/Subscribe tutorial - Topic Subscriber
 * Demonstrates subscribing to a topic for direct messages and receiving messages
 */

/*jslint es6 browser devel:true*/
/*global solace*/
let table, subscriber, client;
let topic_name = "hkjc/ida/fb/v1/tournaments/+/matches/+/wgr/+/pools/+/st";
let topic_name2 = "hkjc/ida/fb/v1/tournaments/+/matches/+/wgr/+/pools/+/sel/+";
let topic_name3 = "hkjc/ida/fb/v1/tournaments/+/matches/+/wgr/+/pools/+/ods";
let topic_name4 = "hkjc/ida/fb/v1/tournaments/+/matches/+/live";
window.onload = function () {
	client = new Paho.MQTT.Client(
		config.mqtt_host,
		config.mqtt_port,
		config.vpn + "1"
	);
	client.onConnectionLost = onConnectionLost;
	client.onMessageArrived = onMessageArrived;

	client.connect({
		userName: config.username,
		password: config.pass,
		onSuccess: onConnect,
		useSSL: true,
		keepAliveInterval: 60,
		reconnect: true,
	});
	// client2 = new Paho.MQTT.Client(
	// 	config.mqtt_host,
	// 	config.mqtt_port,
	// 	config.vpn + "2"
	// );
	// client2.onConnectionLost = onConnectionLost;
	// client2.onMessageArrived = onMessageArrived2;

	// client2.connect({
	// 	userName: config.username,
	// 	password: config.pass,
	// 	onSuccess: onConnect2,
	// 	useSSL: true,
	// });

	var topic_name_txt = document.getElementById("topic_name");
	topic_name_txt.innerHTML =
		topic_name4 +
		" & " +
		topic_name +
		" & " +
		topic_name2 +
		" & " +
		topic_name3;

	table = $("#odd_table").DataTable({ ordering: false, select: true });
	table.on("click", "tr", function () {
		var data = table.row(this).data();
	});
};
function onConnect() {
	// Once a connection has been made, make a subscription and send a message.
	showlog("onConnect");
	client.subscribe(topic_name, {
		onSuccess: successSub,
		onFailure: failSub,
	});
	client.subscribe(topic_name2, {
		onSuccess: successSub2,
		onFailure: failSub,
	});
	client.subscribe(topic_name3, {
		onSuccess: successSub3,
		onFailure: failSub,
	});
	client.subscribe(topic_name4, {
		onSuccess: successNoti,
		onFailure: failSub,
	});
}
// function onConnect2() {
// 	// Once a connection has been made, make a subscription and send a message.
// 	showlog("onConnect");
// 	client.subscribe(topic_name, {
// 		onSuccess: successSub2,
// 		onFailure: failSub,
// 	});
// 	client.subscribe("notice", {
// 		onSuccess: successNoti,
// 		onFailure: failSub,
// 	});
// }
function onConnectionLost(responseObject) {
	if (responseObject.errorCode !== 0)
		showlog("onConnectionLost:" + responseObject.errorMessage);
}
function onMessageArrived(message) {
	console.log(message);
	showlog(
		"onMessageArrived:" +
			message.payloadString +
			"from" +
			message.destinationName
	);
	var temp = JSON.parse(message.payloadString);
	if (temp.clear) {
		table.clear().draw();
	} else if (message.destinationName.split("/")[8] == "live") {
		push_live(temp, message.destinationName);
	} else if (message.destinationName.split("/")[12] == "st") {
		push_st(temp, message.destinationName);
	} else if (message.destinationName.split("/")[12] == "sel") {
		push_chl(temp, message.destinationName);
	} else if (message.destinationName.split("/")[12] == "ods") {
		push_odd(temp, message.destinationName);
	}
}
function successSub(responseObject) {
	showlog("Successfully subscribe to the topic " + topic_name);
	// console.log(responseObject);
}
function successSub2(responseObject) {
	showlog("Successfully subscribe to the topic " + topic_name2);
	// console.log(responseObject);
}
function successSub3(responseObject) {
	showlog("Successfully subscribe to the topic " + topic_name3);
	// console.log(responseObject);
}
function successNoti(responseObject) {
	showlog("Successfully subscribe to the topic " + topic_name4);
	// console.log(responseObject);
}
function failSub(responseObject) {
	showlog("Cannot subscribe to the topic" + responseObject);
}

function iframeloaded() {}
function push_live(match, topic_name) {
	let matchID = topic_name.split("/")[7];
	// showlog(matchID);

	// let { matchID, homeTeam, awayTeam, matchStatus, pool, lastupdated } = match;
	let datas = table
		.rows()
		.data()
		.map((y, index) => {
			return {
				index,
				matchID: y[0],
				PoolState: y[1],
				PoolChannel: y[2],
				PoolOdds: y[3],
			};
		})
		.toArray();
	console.log(datas);
	if (datas.length == 0) {
		if (!match.delete) {
			table.row.add([matchID, null, null, null]).draw(false);
		}
	} else {
		let flag_update = false;
		datas.forEach((x) => {
			if (x.matchID == matchID) {
				if (match.delete) {
					table.row(x.index).remove().draw(false);
				} else {
					table.row.add([matchID, null, null, null]).draw(false);
				}
				// console.log("HERE" + x.index);
				// table.cell(x.index, 1).data(JSON.stringify(match)).draw();
				flag_update = true;
				return;
			}
		});
		if (!flag_update) {
			table.row.add([matchID, null, null, null]).draw(false);
		}
	}
}
function push_st(match, topic_name) {
	let matchID = topic_name.split("/")[7];

	let datas = table
		.rows()
		.data()
		.map((y, index) => {
			return {
				index,
				matchID: y[0],
				PoolState: y[1],
				PoolChannel: y[2],
				PoolOdds: y[3],
			};
		})
		.toArray();
	console.log(datas);
	if (datas.length == 0 && !match.delete) {
		table.row.add([matchID, JSON.stringify(match), null, null]).draw(false);
		// if (match.delete) {
		// 	table.row.add([matchID, null, null, null]).draw(false);
		// } else {
		// 	table.row
		// 		.add([matchID, JSON.stringify(match), null, null])
		// 		.draw(false);
		// }
	} else {
		let flag_update = false;
		datas.forEach((x) => {
			if (x.matchID == matchID) {
				if (match.delete) {
					table.cell(x.index, 1).data(null).draw();
				} else {
					table.cell(x.index, 1).data(JSON.stringify(match)).draw();
				}
				flag_update = true;
				return;
			}
		});
		if (!flag_update && !match.delete) {
			table.row
				.add([matchID, JSON.stringify(match), null, null])
				.draw(false);
			// if (Object.keys(match).length == 0) {
			// 	table.row.add([matchID, null, null, null]).draw(false);
			// } else {
			// 	table.row
			// 		.add([matchID, JSON.stringify(match), null, null])
			// 		.draw(false);
			// }
		}
	}
}
function push_chl(match, topic_name) {
	let matchID = topic_name.split("/")[7];
	showlog(matchID);

	let datas = table
		.rows()
		.data()
		.map((y, index) => {
			return {
				index,
				matchID: y[0],
				PoolState: y[1],
				PoolChannel: y[2],
				PoolOdds: y[3],
			};
		})
		.toArray();
	console.log(datas);
	if (datas.length == 0 && !match.delete) {
		table.row.add([matchID, null, JSON.stringify(match), null]).draw(false);
		// if (Object.keys(match).length == 0) {
		// 	table.row.add([matchID, null, null, null]).draw(false);
		// } else {
		// 	table.row
		// 		.add([matchID, null, JSON.stringify(match), null])
		// 		.draw(false);
		// }
	} else {
		let flag_update = false;
		datas.forEach((x) => {
			if (x.matchID == matchID) {
				if (match.delete) {
					table.cell(x.index, 2).data(null).draw();
				} else {
					table.cell(x.index, 2).data(JSON.stringify(match)).draw();
				}
				flag_update = true;
				return;
			}
		});
		if (!flag_update && !match.delete) {
			table.row
				.add([matchID, null, JSON.stringify(match), null])
				.draw(false);
			// if (Object.keys(match).length == 0) {
			// 	table.row.add([matchID, null, null, null]).draw(false);
			// } else {
			// 	table.row
			// 		.add([matchID, null, JSON.stringify(match), null])
			// 		.draw(false);
			// }
		}
	}
}
function push_odd(match, topic_name) {
	let matchID = topic_name.split("/")[7];
	showlog(matchID);
	let datas = table
		.rows()
		.data()
		.map((y, index) => {
			return {
				index,
				matchID: y[0],
				PoolState: y[1],
				PoolChannel: y[2],
				PoolOdds: y[3],
			};
		})
		.toArray();
	console.log(datas);
	if (datas.length == 0 && !match.delete) {
		table.row.add([matchID, null, null, JSON.stringify(match)]).draw(false);
		// if (Object.keys(match).length == 0) {
		// 	table.row.add([matchID, null, null, null]).draw(false);
		// } else {
		// 	table.row
		// 		.add([matchID, null, null, JSON.stringify(match)])
		// 		.draw(false);
		// }
	} else {
		let flag_update = false;
		datas.forEach((x) => {
			if (x.matchID == matchID) {
				if (match.delete) {
					table.cell(x.index, 3).data(null).draw();
				} else {
					table.cell(x.index, 3).data(JSON.stringify(match)).draw();
				}
				flag_update = true;
				return;
			}
		});
		if (!flag_update && !match.delete) {
			table.row
				.add([matchID, null, null, JSON.stringify(match)])
				.draw(false);
			// if (Object.keys(match).length == 0) {
			// 	table.row.add([matchID, null, null, null]).draw(false);
			// } else {
			// 	table.row
			// 		.add([matchID, null, null, JSON.stringify(match)])
			// 		.draw(false);
			// }
		}
	}
}
function showlog(line) {
	var now = new Date();
	var time = [
		("0" + now.getHours()).slice(-2),
		("0" + now.getMinutes()).slice(-2),
		("0" + now.getSeconds()).slice(-2),
	];
	var timestamp = "[" + time.join(":") + "] ";
	console.log(timestamp + line);
	var logTextArea = document.getElementById("log");
	logTextArea.value += timestamp + line + "\n";
	logTextArea.scrollTop = logTextArea.scrollHeight;
}
