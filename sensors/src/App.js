import React, {Component} from 'react';
import moment from 'moment';
import DatePicker from "react-datepicker";
import Plotly from 'plotly.js';
import createPlotlyComponent from 'react-plotly.js/factory';
import "react-datepicker/dist/react-datepicker.css";
import './App.css';

const Plot = createPlotlyComponent(Plotly);

class App extends Component {

	constructor(props) {

		super(props);

		this.state = {
			json: {
				sensors: [],
				data: []
			},
			plotData: [],
			startDate: null,
			endDate: null,
			chosenSensor: 0,
			chosenStartDate: null,
			chosenEndDate: null,
			error: null
		};
	}


	componentDidMount = () => {

		// Fetch 
		fetch("./report.json").then(response => {

			// Get sensor data 
			response.json().then(json => {

				// Get human readable start date from JSON
				let startDate = moment.unix(json.data[0][0] / 1000).toDate();

				// Get human readable end date from JSON
				let endDate = moment.unix(json.data[json.data.length - 1][0] / 1000).toDate();

				//update state and draw chart
				this.setState({
					error: null,
					json: json,
					startDate: startDate,
					endDate: endDate,
					chosenStartDate: startDate,
					chosenEndDate: endDate
				}, () => {
					this.drawChart();
				});
			});
		}).catch(error => {
			// error message
			this.setState({
				error: error.message
			});
		});
	}

	/**
	 * Draws chart based on the selected sensor from dropdown list
	 *
	 *    
	 * @param event
	 */

	handleChange = (event) => {
		this.setState({
			chosenSensor: event.target.value
		}, () => this.drawChart());
	}

	/**
	 * Update date properties inside state object
	 * with chosen date from datepicker
	 *
	 * @param name
	 * @param date
	 */
	handleDateChange = (name, date) => {
		this.setState({
			[name]: date
		});
	}

	/**
	 * Draws chart based on data from json file
	 * and based on user's selected parameters
	 */
	drawChart = () => {

		// Get JSON data from state
		let jsonData = this.state.json.data;

		// Set sensor values object with default data
		let sensorValues = {
			value: [],
			maxValue: [],
			minValue: [],
			validValue: [],
			valueUnit: ''
		};

		// Store x axis values
		let x = [];

		/**
		 * Store plot data needed for drawing chart
		 *
		 * @type [{
					x: [1, 2, 3],
					y: [10, 20, 30],
					type: 'line',
					name: 'value',
					line: {
						color: 'rgb(255,0,0)',
						width: 1
					}
				}]
		 */
		let plotData = [];

		// Get chart line colors
		let colors = this.getLineColors();

		// Loop through json data that represents rows (array of array)
		for(let i = 0; i < jsonData.length; i++) {

			let row = jsonData[i];

			// Get human readable date from hour timestamp in milliseconds
			let date = moment.unix(row[0] / 1000);

			// Check if row date is between selected period of dates
			if(date.isBetween(this.state.chosenStartDate, this.state.chosenEndDate, undefined, '[]')) {

				// In x axis store human readable hour timestamp
				x.push(date.format('DD.MM.YYYY HH:mm'));

		
				sensorValues.value.push(row[1][this.state.chosenSensor].value);
				sensorValues.minValue.push(row[1][this.state.chosenSensor]['value-min']);
				sensorValues.maxValue.push(row[1][this.state.chosenSensor]['value-max']);
				sensorValues.validValue.push(row[1][this.state.chosenSensor]['value-valid']);
				sensorValues.valueUnit = row[1][this.state.chosenSensor]['value-unit'];
			}
		}

		// Loop through sensorValues object and get object keys
		Object.keys(sensorValues).map((key, index) => {

			// Check if object key is not equal to 'valueUnit'
			if(key !== 'valueUnit') {

				// Store to plotData array line chart data for every sensor value
				return plotData[index] = {
					x: x,
					y: sensorValues[key],
					type: 'line',
					name: key + ' (' + sensorValues['valueUnit'] + ')',
					line: {
						color: colors[index],
						width: 1
					}
				};
			}

			return false;
		});

		// Update state with given plot data
		this.setState({
			plotData: plotData
		});
	}

	/**
	 * Get chart plot layout
	 *
	 * @returns object
	 */
	getPlotLayout = () => {

		return {
			autosize: false,
			width: 1680, // 1680px
			height: 1000, // 1000px
			margin: {
				l: 150, // left: 150px
				r: 50, // right: 50px
				b: 150, // bottom: 150px
				t: 0 // top: 0px
			}
		};
	}

	/**
	 * Get chart line colors
	 *
	 * @returns array
	 */
	getLineColors = () => {

		return [
			'rgb(255,0,0)', 
			'rgb(0,0,255)',
			'rgb(0,255,0)', 
			'rgb(128,0,128)' 
		];
	}

	/**
	 * Describe view to be rendered to the browser window
	 *
	 * @returns {JSX.Element}
	 */
	render = () => {

		return (

			<div className="app">

				<div className="row">
					<div className="dropdown">
						<label htmlFor="dropdown">Choose Sensor:</label>
						<select id="dropdown" onChange={this.handleChange} value={this.state.chosenSensor}>
							{ this.state.json.sensors.map((sensor, key) => <option key={sensor.id} value={key}>{sensor.type}</option>) }
						</select>
					</div>

					<div className="filter">
						<div className="mg-b-20">
							<label>Start Date:</label>
							<DatePicker
								selected={this.state.chosenStartDate}
								onChange={(date) => this.handleDateChange('chosenStartDate', date)}
								dateFormat="dd.MM.yyyy"
								minDate={this.state.startDate}
								maxDate={this.state.endDate}
							/>
						</div>
						<div className="mg-b-20">
							<label>End Date:</label>
							<DatePicker
								selected={this.state.chosenEndDate}
								onChange={(date) => this.handleDateChange('chosenEndDate', date)}
								dateFormat="dd.MM.yyyy"
								minDate={this.state.chosenStartDate}
								maxDate={this.state.endDate}
							/>
						</div>
						<button className="btn-block mg-b-20" onClick={this.drawChart}>Filter</button>
					</div>
				</div>

				{
					this.state.error
						? <h2>{this.state.error}</h2>
						: <Plot
							data={this.state.plotData}
							layout={this.getPlotLayout()}
							config={{
								displayModeBar: false
							}}
						/>
				}


			</div>
		);
	}
}

export default App;
