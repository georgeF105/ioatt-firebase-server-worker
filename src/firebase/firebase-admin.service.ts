import * as admin from 'firebase-admin';

export class FirebaseService {
  constructor (
    private firebaseAdmin
  ) { }
}

export default new FirebaseService(admin);
