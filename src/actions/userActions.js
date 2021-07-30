import axios from 'axios'
import auth from '..//components/security/auth'

export function createOrLoginUser(endpoint, userData, routerProps) {
    // debugger
    axios.post(endpoint, {user: userData})
    .then(response => {
        // localStorage.setItem('token', response.data.jwt)
        // routerProps.history.push('/')
        console.log("you pressed 'Log in'")
    })
    .catch(error => {
        auth.logout()
        console.log(error)
    })
}

const authorization= () => {
    const token ="a"
    if (token) {
        return "Send API call to check user's credentials"
    }
    return auth.logout()


}