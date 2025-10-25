import jwt from 'jsonwebtoken';

export function sign(payload: string | Buffer | object, secretOrPrivateKey: jwt.Secret, options: jwt.SignOptions) {
	return new Promise((resolve, reject) => {
		jwt.sign(payload, secretOrPrivateKey, options, (error, token) => {
			if (error) {
				reject(error);
			}
			else {
				resolve(token!);
			}
		});
	})
}
