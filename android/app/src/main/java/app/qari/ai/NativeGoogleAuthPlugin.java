package app.qari.ai;

import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.Signature;
import android.content.pm.SigningInfo;
import android.os.Build;
import android.util.Log;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.auth.api.signin.GoogleSignIn;
import com.google.android.gms.auth.api.signin.GoogleSignInAccount;
import com.google.android.gms.auth.api.signin.GoogleSignInClient;
import com.google.android.gms.auth.api.signin.GoogleSignInOptions;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.tasks.Task;
import com.google.firebase.auth.AuthCredential;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;
import com.google.firebase.auth.GoogleAuthProvider;
import java.security.MessageDigest;

@CapacitorPlugin(name = "NativeGoogleAuth")
public class NativeGoogleAuthPlugin extends Plugin {
    private static final String TAG = "NativeGoogleAuth";
    private FirebaseAuth mAuth;

    @Override
    public void load() {
        mAuth = FirebaseAuth.getInstance();
    }

    private String getAppSignature() {
        try {
            PackageInfo info;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                info = getContext().getPackageManager().getPackageInfo(getContext().getPackageName(), PackageManager.GET_SIGNING_CERTIFICATES);
                SigningInfo signingInfo = info.signingInfo;
                Signature[] signatures = signingInfo.hasMultipleSigners() ? signingInfo.getApkContentsSigners() : signingInfo.getSigningCertificateHistory();
                return bytesToHex(signatures[0].toByteArray());
            } else {
                info = getContext().getPackageManager().getPackageInfo(getContext().getPackageName(), PackageManager.GET_SIGNATURES);
                return bytesToHex(info.signatures[0].toByteArray());
            }
        } catch (Exception e) {
            return "ERROR";
        }
    }

    private String bytesToHex(byte[] bytes) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA1");
            md.update(bytes);
            byte[] digest = md.digest();
            StringBuilder hexString = new StringBuilder();
            for (byte b : digest) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString().toUpperCase().replaceAll("..(?!$)", "$0:");
        } catch (Exception e) {
            return "HASH_ERROR";
        }
    }

    @PluginMethod
    public void signIn(PluginCall call) {
        String activeSha1 = getAppSignature();
        Log.d(TAG, "QARI_DEBUG: Starting Sign-In. App SHA-1: " + activeSha1);
        
        String webClientId = "";
        try {
            int stringId = getContext().getResources().getIdentifier("default_web_client_id", "string", getContext().getPackageName());
            if (stringId != 0) {
                webClientId = getContext().getString(stringId);
            } else {
                webClientId = "284616519796-bre587n3jilglr8sjft871kt4tqb0v1p.apps.googleusercontent.com";
            }
        } catch (Exception e) {
            webClientId = "284616519796-bre587n3jilglr8sjft871kt4tqb0v1p.apps.googleusercontent.com";
        }

        GoogleSignInOptions gso = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                .requestIdToken(webClientId)
                .requestEmail()
                .requestProfile()
                .build();
        
        GoogleSignInClient client = GoogleSignIn.getClient(getActivity(), gso);
        client.signOut().addOnCompleteListener(task -> {
            startActivityForResult(call, client.getSignInIntent(), "handleSignInResult");
        });
    }

    @ActivityCallback
    private void handleSignInResult(PluginCall call, ActivityResult result) {
        Task<GoogleSignInAccount> task = GoogleSignIn.getSignedInAccountFromIntent(result.getData());
        try {
            GoogleSignInAccount account = task.getResult(ApiException.class);
            Log.d(TAG, "QARI_DEBUG: Google Login Success");
            firebaseAuthWithGoogle(account.getIdToken(), call);
        } catch (ApiException e) {
            int code = e.getStatusCode();
            String activeSha1 = getAppSignature();
            Log.e(TAG, "QARI_DEBUG: Sign-In FAIL. Code: " + code + " | Active SHA-1: " + activeSha1);
            call.reject("Login failed (" + code + "). Ensure SHA-1 " + activeSha1 + " is in Firebase.");
        }
    }

    private void firebaseAuthWithGoogle(String idToken, PluginCall call) {
        AuthCredential credential = GoogleAuthProvider.getCredential(idToken, null);
        mAuth.signInWithCredential(credential).addOnCompleteListener(getActivity(), task -> {
            if (task.isSuccessful()) {
                JSObject ret = new JSObject();
                ret.put("uid", mAuth.getUid());
                ret.put("idToken", idToken);
                call.resolve(ret);
            } else {
                call.reject("Firebase Error: " + task.getException().getMessage());
            }
        });
    }
}
