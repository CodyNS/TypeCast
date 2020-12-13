'use strict';

import React from 'react';
import Cookies from 'js-cookie';
import WithAuth from './withAuth';
import './_styling/profile.css';

class Profile extends React.Component {
	constructor() {
		super();
		this.newUsername = React.createRef();
		this.currentPassword = React.createRef();
		this.newPassword1 = React.createRef();
		this.newPassword2 = React.createRef();
		this.state = {
			username: "",
			password: "",
			pastGamesUI: [],
			LPM: 0.0,
			changeUNVisible: false,
			changePWVisible: false,
			delAcctVisible: false
		}
	}

	componentDidMount = () => {
		this.loadUserData();
		const tableWidth = document.querySelector("#past-games").offsetWidth;
		let tableContainer = document.querySelector("#table-container");
		tableContainer.style.width = tableWidth + "px";
		this.sizeTheExtendedFooter("initial load");
	}

	loadUserData = () => {
		if (JSON.parse(Cookies.get('userData') === undefined))  {
			alert("Not Logged into a valid account!");
			window.location.href = '/login';
		}
		const username = JSON.parse(Cookies.get('userData').split('j:')[1]).username;
		if (username === undefined)  {
			alert("Not Logged into a valid account!");
			window.location.href = '/login';
		}
		else  {
			fetch('/userData/games', {
				method: 'GET',
				credentials: "include",
				headers: { 'Content-Type': 'application/json' }
			})
				.then(async res => {
					if (res.status === 200) {
						res = await res.json();
						const pastGamesUI = this.generatePastGamesUI();
						this.setState({ LPM: res.lpm, pastGamesUI: res.games, username: username });
					} else alert("An error occured while finding your past games");
				})
				.catch(err => {
					alert("An error occured while finding your past games");
				});
			}
	}

	clearHistory = () => {
		fetch('/userData/games', {
			method: 'DELETE',
			credentials: "include",
			headers: { 'Content-Type': 'application/json' }
		})
			.then(res => {
				if (res.status === 200) this.setState({ pastGames: [], LPM: 0 });
				else alert("Game data reset was unsuccessful.");
			})
			.catch(err => {
				alert("Game data reset was unsucessful.");
			});
	}

	updateUsernameHandler = (event) => {
		event.preventDefault();
		fetch('/users/', {
			method: 'PUT',
			credentials: "include",
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				newUsername: this.state.newUsername,
				oldPassword: this.password.current.value,
				newPassword: this.password.current.value
			})
		})
			.then(res => {
				if (res.status === 200) alert("Username successfully changed.");
				else alert("Username change was unsucessful.");
			})
			.catch(err => {
				alert("Username change was unsucessful.");
			});
	}

	updatePasswordHandler = (event) => {
		event.preventDefault();
		if (!this.newPasswordInfoChecksOut()) return;
		fetch('/users/', {
			method: 'PUT',
			credentials: "include",
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				newUsername: this.username.current.value,
				oldPassword: this.password.current.value,
				newPassword: this.state.newPassword
			})
		})
			.then(res => {
				if (res.status === 200) alert("Password successfully changed.");
				else alert("Password change was unsucessful.");
			})
			.catch(err => {
				alert("Password change was unsucessful.");
			});
	}

	deleteAccountHandler = () => {
		fetch('/users/', {
			method: 'DELETE',
			credentials: "include",
			headers: { 'Content-Type': 'application/json' }
		})
			.then(res => {
				if (res.status === 200) window.location.href = '/login'; //Send to login page
				else alert("Could not delete account.");
			})
			.catch(err => {
				alert("An error has occured. Could not delete account.");
			});
	}

	sizeTheExtendedFooter = (situation) => {
		// This is janky af. Clean this up if there's time:
		const extFooter = document.querySelector('#extended-footer');
		let offset = extFooter.getBoundingClientRect();
		let topOfFooter = offset.top;
		let diff = window.innerHeight - topOfFooter;
		if (diff > 420) {  // need at least this much px height for the bottom ctrl pannel
			if (situation === "initial load") {
				extFooter.style.cssText = "min-height: calc(100vh - (148px + 398px + 5.5rem));" +
					"position: relative; height: 420px";
			} else if (situation === "after deletion") {
				extFooter.style.cssText = "min-height: calc(100vh - (255px + 70px + 5.5rem))";
			}
		}
	}

	showChangeUsername = () => {
		this.setState({ changeUNVisible: true, changePWVisible: false, delAcctVisible: false });
	}

	showChangePassword = () => {
		this.setState({ changeUNVisible: false, changePWVisible: true, delAcctVisible: false });
	}

	showDeleteAccount = () => {
		this.setState({ changeUNVisible: false, changePWVisible: false, delAcctVisible: true });
	}

	newPasswordInfoChecksOut = () => {
		if (this.state.currentPassword !== this.state.password) {
			alert("Oops! You entered your current password incorrectly. Try again.");
			this.setState({ currentPassword: '' });
		}
		else if (this.state.newPassword !== this.state.newPassword2) {
			alert("Woops: your new passwords don't match! Please re-enter them.");
			this.setState({ newPassword: '', newPassword2: '' });
		}
		else if (this.state.newPassword === '') {
			alert("Sorry, but you need to have a password (you can't set an empty password.)");
		}
		else return true;
		return false;
	}

	closePanel = () => {
		this.setState({ changeUNVisible: false, changePWVisible: false, delAcctVisible: false });
	}

	myChangeHandler = (event) => {
		let name = event.target.name;
		let val = event.target.value;
		this.setState({ [name]: val });
	}

	formatPosition = (pos) => {
		switch (pos) {
			case (1): return "1st";
			case (2): return "2nd"; 
			case (3): return "3rd"; 
			default: return pos + "th";
		}
	}

	generatePastGamesUI = () => {
		let pastGamesTable = [];
		pastGamesTable.push(
			<tr key="headings">
				<td className="position">Result</td>
				<td className="speed">Speed</td>
				<td className="time">Time</td>
				<td className="date">Date</td>
			</tr>
		);
		for (let i = 0; i < this.state.pastGames.length; i++) {
			pastGamesTable.push(
				<tr key={"game" + (i + 1)}>
					<td className="position">
						{this.formatPosition(this.state.pastGames[i].position)}
					</td>
					<td className="speed">
						<pre>
							{this.state.pastGames[i].lpm > 9 ?
								this.state.pastGames[i].lpm
								: " " + this.state.pastGames[i].lpm}
						</pre> <span className="lpm">LPM</span>
					</td>
					<td className="time">{this.state.pastGames[i].time}</td>
					<td className="date">{this.state.pastGames[i].date}</td>
				</tr>
			); 
		}
		this.setState({ pastGamesUI: pastGamesTable });
	}

	render = () => {
		return (
			<div id='profile'>
				<div id="tophalf-profile">
					<div id="profile-heading"><h1>{this.state.username}</h1></div>
					<div id="table-container">
						<div id="table-forehead">Your Race Results</div>
						<table id="past-games"><tbody>{this.state.pastGamesUI}</tbody></table>
						<div id="table-chin">
							<div id="avg-speed">
								Average LPM: <div id="avg-speed-nbr">{this.state.LPM}</div>
							</div>
							<button onClick={() => this.clearHistory()}
								className="text-btn">Reset Score?</button>
						</div>
					</div>
				</div>
				<div id="extended-footer">
					<div id="user-menu">
						<button onClick={() => this.showChangeUsername()}>Change UserName</button>
						<button onClick={() => this.showChangePassword()}>Change Password</button>
						<button onClick={() => this.showDeleteAccount()}
							className="del-acct-btn">Delete Account</button>
					</div>
					{this.state.changeUNVisible ?
						<div id="change-username-box">
							<form onSubmit={this.updateUsernameHandler}>
								<label>Username &nbsp;</label>
								<input
									type="text"
									name="newUsername"
									value={this.state.newUsername}
									onChange={this.myChangeHandler}
								/>
								<input type='submit' value='Change' />
							</form>
						</div>
						:
						<p></p>
					}
					{this.state.changePWVisible ?
						<div id="change-password-box">
							<form onSubmit={this.updatePasswordHandler}>
								<div className="flex-container">
									<label>Current password &nbsp;</label>
									<input
										type="password"
										name="currentPassword"
										value={this.state.currentPassword}
										onChange={this.myChangeHandler}
									/>
								</div>
								<div className="flex-container">
									<label>New password &nbsp;</label>
									<input
										type="password"
										name="newPassword"
										value={this.state.newPassword}
										onChange={this.myChangeHandler}
									/>
								</div>
								<div className="flex-container">
									<label>Confirm &nbsp;</label>
									<input
										type="password"
										name="newPassword2"
										value={this.state.newPassword2}
										onChange={this.myChangeHandler}
									/>
								</div>
								<input type='submit' value='Change' />
							</form>
						</div>
						:
						<p></p>
					}
					{this.state.delAcctVisible ?
						<div id="delete-account-box">
							Are you SURE you want to delete your account?<br />
              				It will be gone forever.<br />
							<button onClick={() => this.deleteAccountHandler()}
								className="delete-acct-button">
								YES, PERMANENTLY DELETE MY ACCOUNT
              				</button>
							<br />
							<button onClick={() => this.closePanel()} className="changed-my-mind">
								No! Get me out of here!
              				</button>
						</div>
						:
						<p></p>
					}
					{this.state.changeUNVisible || this.state.changePWVisible ?
						<div id="close-pannel-container">
							<button onClick={() => this.closePanel()} className="text-btn">close pannel</button>
						</div>
						:
						<p></p>
					}
				</div>
			</div>
		);
	}
}

export default WithAuth(Profile);