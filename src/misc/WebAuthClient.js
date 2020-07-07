//@flow

import cbor from "cbor"
import type {User} from "../api/entities/sys/User"
import {base64ExtToBase64, base64ToUint8Array} from "../api/common/utils/Encoding"
import {isApp} from "../api/Env"

export type WebAuthValidationData = {}


export type WebAuthCreateData = {}

/**
 * Wrapper client for the web authentication api.
 * https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API
 */
export class WebAuthClient {

	isSupported(): Promise<boolean> {
		return Promise
			.resolve(
				!isApp() && !!navigator.credentials
			)
			.catch(() => false)
	}


	register(challenge: Uint8Array, user: User): Promise<WebAuthCreateData> {

		const publicKey = {
			pubKeyCredParams: [
				// We would like an elliptic curve to be used if possible
				{
					type: "public-key",
					alg: -7
				},
				// If not, then we will fallback on an RSA algorithm
				// {
				// 	type: "public-key",
				// 	alg: -37
				// }
			],
			challenge: challenge /* this actually is given from the server */,
			rp: {
				name: "Tutanota",
				id: "tutanota.com"
			},
			user: {
				id: base64ToUint8Array(base64ExtToBase64(user._id)), /* To be changed for each user */
				name: "Test Name",
				displayName: "Test DispName",
			}
		};


		const credentials = navigator.credentials
		if (credentials) {
			return credentials.create({publicKey})
			                  .then(function (newCredentialInfo) {
					                  // send attestation response and client extensions
					                  // to the server to proceed with the registration
					                  // of the credential
					                  // console.log(newCredentialInfo)
					                  // if (newCredentialInfo instanceof PublicKeyCredential) {
					                  //     const publicKeyCredentials = downcast(newCredentialInfo)
					                  //     console.log(cbor.decode(publicKeyCredentials.response.attestation))
					                  //
					                  //     return {}

					                  if (newCredentialInfo && newCredentialInfo.type === "public-key" && newCredentialInfo.response) {
						                  const response: any = newCredentialInfo.response
						                  console.log(cbor.decode(response.attestationObject))
					                  } else {
						                  throw new Error("Unknown credential type")
					                  }
				                  }
			                  ).catch((err) => {
						throw new Error(err)
					}
				)
		} else {
			return Promise.reject("not supported")
		}
	}

	sign(): Promise<WebAuthValidationData> {
		return Promise.resolve({})
	}
}