import axios from 'axios'
import auth from "../components/security/auth"


const token = localStorage.getItem('token')
const axiosConfig = {
    headers: {
        Authorization: `Bearer ${token}`
    }
}
let url

export function authentication() {
    const token = localStorage.getItem('token')
    return (dispatch) => {
        if (token) {
            // console.log("Logged in worked")
            // dispatch({type:'SET_USER', payload: response.data})   
            return auth.login()
        } else if (token === undefined) {
            // console.log("Logged out worked")
             return auth.logout()
        }
    }
}

// export function authorization(endpoint=null, routerProps=null ) {
//     const token = localStorage.getItem('token')
//     let url
//     endpoint ? url= endpoint : url= '/profile' 
//     // console.log("Security called")
//     // debugger
//     if(token){
//         return async (dispatch) => {
//            const response = await axios.get(`http://localhost:3000${url}`, {
//                 headers: {
//                     Authorization: `Bearer ${token}`
//                 }
//             })
//             // .then(response => {
//                 console.log(response)
//                 dispatch({type:'SET_USER', payload: response.data})   
//             // })
//             .catch(error => {
//                 dispatch({type: 'LOGOUT_USER'})
//                 console.log(error)
//                 // return routerProps ? routerProps.history.push('/') : null
//             })
//         }
//     } return (dispatch) => {
//         dispatch({type: 'LOGOUT_USER'})
//     }
// }
export function authorization(endpoint=null, routerProps=null ) {
    endpoint ? url= endpoint : url= '/profile' 
    if(token){
        return async (dispatch) => {
           const response = await axios.get(`http://localhost:3000${url}`, axiosConfig)
             .catch(error => {
                dispatch({type: 'LOGOUT_USER'})
                console.log(error)
             })
            console.log(response)
            dispatch({type:'SET_USER', payload: response.data})   
        }
    } return (dispatch) => {
        dispatch({type: 'LOGOUT_USER'})
    }
}