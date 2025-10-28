import {Component} from 'react'
import {Link} from 'react-router-dom'
import Loader from 'react-loader-spinner'
import Header from '../Header'
import LinearChart from '../LinearChart'
import LanguageRepoCountPie from '../LangRepoCountPie'
import LanguageCommitCountPie from '../LangCommitCountPie'
import RepoCommitCountPie from '../RepoCommitCountPie'
import './index.css'

const API_BASE = 'https://apis2.ccbp.in/gpv'

const apiStatusConstants = {
  initial: 'INITIAL',
  success: 'SUCCESS',
  failure: 'Failure',
  inProgress: 'IN_PROGRESS',
}

class Analysis extends Component {
  state = {analysisList: {}, apiStatus: apiStatusConstants.initial}

  componentDidMount() {
    const {username: propUser} = this.props
    const propUserSafe = propUser || ''

    const stored = localStorage.getItem('gpv_username') || ''
    const effectiveUser =
      propUserSafe && propUserSafe.trim() ? propUserSafe : stored

    if (!effectiveUser) {
      this.renderNoDataFound()
    } else {
      this.getGitHubUserAnalysisDetails()
    }
  }

  getGitHubUserAnalysisDetails = async () => {
    let {username} = this.props
    if (!username) {
      username = localStorage.getItem('gpv_username') || ''
    }

    this.setState({apiStatus: apiStatusConstants.inProgress})

    const apiKey = process.env.REACT_APP_GPV_API_KEY
    const usernameSafe = encodeURIComponent(
      (username || '').trim().toLowerCase(),
    )

    if (!apiKey) {
      console.error('Define REACT_APP_GPV_API_KEY in .env')
      this.setState({apiStatus: apiStatusConstants.failure})
      return
    }
    if (!usernameSafe) {
      this.setState({apiStatus: apiStatusConstants.failure})
      return
    }

    const url = `${API_BASE}/profile-summary/${usernameSafe}?api_key=${apiKey}`
    const options = {method: 'GET'}
    const response = await fetch(url, options)

    if (response.ok === true) {
      const data = await response.json()
      const updatedData = data
      this.setState({
        analysisList: updatedData,
        apiStatus: apiStatusConstants.success,
      })
    } else {
      this.setState({apiStatus: apiStatusConstants.failure})
    }
  }

  descendingSort = (a, b) => b.value - a.value

  renderAnalysisSuccessView = () => {
    const {analysisList} = this.state
    const analysisListLength = Object.keys(analysisList).length === 0

    if (analysisListLength) {
      return (
        <div className="noDataRepoAnalysisContainer">
          <img
            src="https://res.cloudinary.com/ddsn9feta/image/upload/v1719653254/Layer_3_1_jxjnnu.png"
            alt="no analysis"
            className="no-data-image"
          />
          <h1 className="noDataHeading">No Analysis Found!</h1>
        </div>
      )
    }

    const {
      user,
      quarterCommitCount,
      langRepoCount,
      langCommitCount,
      repoCommitCount,
    } = analysisList
    const {avatarUrl, login} = user

    const quarterCommitData = []
    const quarterCommitKeyNames = Object.keys(quarterCommitCount)
    quarterCommitKeyNames.forEach(keyName => {
      quarterCommitData.push({
        name: keyName,
        commits: quarterCommitCount[keyName],
      })
    })
    const quarterCommitSlicedData = quarterCommitData
      .sort((a, b) => b.commits - a.commits)
      .slice(0, Object.keys(quarterCommitCount).length)

    const langRepoData = []
    const langRepoKeyNames = Object.keys(langRepoCount)
    langRepoKeyNames.forEach(keyName => {
      langRepoData.push({name: keyName, value: langRepoCount[keyName]})
    })
    const langRepoSlicedData = langRepoData
      .sort(this.descendingSort)
      .slice(0, Object.keys(langRepoCount).length)

    const langCommitData = []
    const langCommitKeyNames = Object.keys(langCommitCount)
    langCommitKeyNames.forEach(keyName => {
      langCommitData.push({name: keyName, value: langCommitCount[keyName]})
    })
    const langCommitSlicedData = langCommitData
      .sort(this.descendingSort)
      .slice(0, Object.keys(langCommitCount).length)

    const repoCommitData = []
    const repoCommitKeyNames = Object.keys(repoCommitCount)
    repoCommitKeyNames.forEach(keyName => {
      repoCommitData.push({name: keyName, value: repoCommitCount[keyName]})
    })
    const slicedData = repoCommitData.sort(this.descendingSort).slice(0, 10)

    return (
      <div className="AnalysisSuccessViewContainer">
        <div className="analysisHeadingContainer">
          <h1 className="analysis">{login}</h1>
          <img src={avatarUrl} alt={login} className="repoAvatarUrl" />
        </div>
        <div className="linearChartContainer">
          <div>
            <LinearChart quarterCommitCount={quarterCommitSlicedData} />
          </div>
        </div>
        <div className="langRepoCommitCountContainer">
          <div className="pielanguageCountContainer">
            <h1 className="pieLangCountHeadingRep">Language Per Repos</h1>
            <LanguageRepoCountPie langRepoCount={langRepoSlicedData} />
          </div>
          <div className="pielCommitanguageCountContainer">
            <h1 className="pieLangCountHeading">Language Per Commits</h1>
            <LanguageCommitCountPie langCommitCount={langCommitSlicedData} />
          </div>
        </div>
        <div className="repoCommitDescContainer">
          <div className="repoCommitContainer">
            <h1 className="repoCommitHeading">Commits Per Repo (Top 10)</h1>
            <RepoCommitCountPie repoCommitCount={slicedData} />
          </div>
        </div>
      </div>
    )
  }

  onClickTryAgain = () => {
    this.getGitHubUserAnalysisDetails()
  }

  renderFailureView = () => (
    <div className="analysisFailureContainer">
      <img
        src="https://res.cloudinary.com/ddsn9feta/image/upload/v1718604995/Group_7522_f4ueqy.png"
        alt="failure view"
        className="error-view"
      />
      <p className="errorName">Something went wrong. Please try again</p>
      <button
        className="tryButton"
        type="button"
        onClick={this.onClickTryAgain}
      >
        Try again
      </button>
    </div>
  )

  renderLoaderView = () => (
    <div className="analysis-loader-container" data-testid="loader">
      <Loader type="TailSpin" color="#3B82F6" height={50} width={50} />
    </div>
  )

  renderGitAnalysisDetails = () => {
    const {apiStatus} = this.state

    switch (apiStatus) {
      case apiStatusConstants.success:
        return this.renderAnalysisSuccessView()
      case apiStatusConstants.failure:
        return this.renderFailureView()
      case apiStatusConstants.inProgress:
        return this.renderLoaderView()
      default:
        return null
    }
  }

  renderNoDataFound = () => (
    <div className="noDataFoundContainer">
      <img
        src="https://res.cloudinary.com/ddsn9feta/image/upload/v1718949987/Repository-NoDataFound-2x_dzw1h2.png"
        alt="empty analysis"
        className="analysis-no-data-img"
      />
      <h1 className="analysis-no-data-heading">No Data Found</h1>
      <p className="analysis-no-data-desc">
        GitHub Username is empty, please provide a valid username for Analysis.
      </p>
      <Link to="/">
        <button
          type="button"
          className="goto-home-button"
          onClick={this.onClickGotoHome}
        >
          Go to Home
        </button>
      </Link>
    </div>
  )

  render() {
    const {username: propUser} = this.props
    const propUserSafe = propUser || ''

    const stored = localStorage.getItem('gpv_username') || ''
    const resolvedUser =
      propUserSafe && propUserSafe.trim() ? propUserSafe : stored

    return (
      <>
        <Header />
        <div className="analysisContainer">
          {resolvedUser === '' ? (
            this.renderNoDataFound()
          ) : (
            <div className="testcaseContainer">
              <h1 className="analysisTestHeading">Analysis</h1>
              {this.renderGitAnalysisDetails()}
            </div>
          )}
        </div>
      </>
    )
  }
}

export default Analysis
