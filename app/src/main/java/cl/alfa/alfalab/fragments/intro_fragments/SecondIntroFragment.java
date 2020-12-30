package cl.alfa.alfalab.fragments.intro_fragments;

import android.app.ProgressDialog;
import android.content.Context;
import android.os.Bundle;
import android.text.Html;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.CheckBox;
import android.widget.TextView;
import android.widget.Toast;

import com.google.android.material.floatingactionbutton.ExtendedFloatingActionButton;
import com.google.android.material.textfield.TextInputEditText;
import com.google.android.material.textfield.TextInputLayout;
import com.google.gson.Gson;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;

import androidx.annotation.NonNull;
import androidx.appcompat.widget.Toolbar;
import androidx.fragment.app.Fragment;

import java.io.IOException;
import java.util.Objects;

import cl.alfa.alfalab.MainActivity;
import cl.alfa.alfalab.MainApplication;
import cl.alfa.alfalab.R;
import cl.alfa.alfalab.activities.OnBoardingActivity;
import cl.alfa.alfalab.api.ApiClient;
import cl.alfa.alfalab.api.ApiService;
import cl.alfa.alfalab.models.AuthUser;
import cl.alfa.alfalab.models.LoginData;
import cl.alfa.alfalab.utils.SharedPreferences;
import okhttp3.ResponseBody;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class SecondIntroFragment extends Fragment {

    private final Context context = MainApplication.getContext();
    private static TextInputEditText emailInputEditText, passwordInputEditText;
    private TextInputLayout emailInputLayout, passwordInputLayout;
    private CheckBox checkBox;
    private ProgressDialog progressDialog;
    private SharedPreferences mSharedPreferences;

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        final View view = inflater.inflate(R.layout.second_intro_fragment_layout, container, false);

        mSharedPreferences = new SharedPreferences(context);

        final Toolbar mToolbar = view.findViewById(R.id.toolbar);
        final ExtendedFloatingActionButton button = view.findViewById(R.id.button);
        final TextView signUpText = view.findViewById(R.id.sign_up_text_link);
        checkBox = view.findViewById(R.id.checkbox);
        emailInputLayout = view.findViewById(R.id.email_input_layout);
        passwordInputLayout = view.findViewById(R.id.password_input_layout);
        emailInputEditText = view.findViewById(R.id.email_edit_text);
        emailInputLayout.setHint(Html.fromHtml(getString(R.string.login_email_hint)));
        passwordInputEditText = view.findViewById(R.id.password_edit_text);
        passwordInputLayout.setHint(Html.fromHtml(getString(R.string.login_password_hint)));

        mToolbar.setNavigationIcon(R.drawable.ic_arrow_back_24dp);
        mToolbar.setNavigationOnClickListener(v -> OnBoardingActivity.setPosition(0));

        signUpText.setOnClickListener(v -> OnBoardingActivity.setSignUpItemPosition());

        button.setOnClickListener(v -> validateForm());

        return view;
    }

    private void validateForm() {
        boolean isValid = true;
        if (emailInputEditText.getEditableText().toString().isEmpty()) {
            emailInputLayout.setError(getResources().getString(R.string.required));
            isValid = false;
        } else {
            emailInputLayout.setError(null);
        }
        if (passwordInputEditText.getEditableText().toString().isEmpty()) {
            passwordInputLayout.setError(getResources().getString(R.string.required));
            isValid = false;
        } else {
            passwordInputLayout.setError(null);
        }
        if (isValid) {
            login(Objects.requireNonNull(emailInputEditText.getText()).toString(), Objects.requireNonNull(passwordInputEditText.getText()).toString());
        }
    }

    private void login(@NonNull String email, @NonNull String password) {
        progressDialog = ProgressDialog.show(getActivity(), "🙌 Iniciando sesión...", "Esto puede tardar un poco.", true);

        final ApiService.GetAuthService service = ApiClient.getClient().create(ApiService.GetAuthService.class);
        final Call<ResponseBody> responseCall = service.getAuth(new LoginData(email, password));

        responseCall.enqueue(new Callback<ResponseBody>() {

            JsonElement token = null;
            String refreshToken = null;

            @Override
            public void onResponse(@NonNull Call<ResponseBody> call, @NonNull Response<ResponseBody> response) {
                progressDialog.dismiss();

                if (response.body() != null) {
                    try {
                        final Gson gson = new Gson();
                        final JsonObject jsonObject = gson.fromJson(response.body().string(), JsonObject.class);
                        token = jsonObject.get("token");
                        refreshToken = Objects.requireNonNull(response.headers().get("Refresh-Token"));

                        if (checkBox.isChecked()) {
                            mSharedPreferences.setToken(refreshToken.replace("\"", ""));
                        } else {
                            mSharedPreferences.setToken(token.toString().replace("\"", ""));
                        }

                        if (response.isSuccessful() && token != null) {
                            final ApiService.GetUserService userService = ApiClient.getClient().create(ApiService.GetUserService.class);
                            final Call<AuthUser> userResponseCall = userService.getUser(mSharedPreferences.getToken().replace("\"", ""));

                            userResponseCall.enqueue(new Callback<AuthUser>() {
                                @Override
                                public void onResponse(@NonNull Call<AuthUser> call, @NonNull Response<AuthUser> response) {
                                    if (response.isSuccessful()) {
                                        emailInputLayout.clearOnEditTextAttachedListeners();
                                        passwordInputLayout.clearOnEditTextAttachedListeners();
                                        assert response.body() != null;
                                        mSharedPreferences.setResponsible(response.body());
                                        OnBoardingActivity.setLastItemPosition();
                                    } else {
                                        Toast.makeText(context, getResources().getString(R.string.wrong_credentials), Toast.LENGTH_SHORT).show();
                                        Log.e(MainActivity.API, "GetUserService - onResponse (response.errorBody): " + response.errorBody());
                                        Log.e(MainActivity.API, "GetUserService - onResponse (response.raw): " + response.raw().toString());
                                        Log.e(MainActivity.API, "GetUserService - onResponse (response.message): " + response.message());
                                        Log.e(MainActivity.API, "GetUserService - onResponse (call.request.body): " + call.request().body());
                                    }
                                }

                                @Override
                                public void onFailure(@NonNull Call<AuthUser> call, @NonNull Throwable t) {
                                    Toast.makeText(context, getResources().getString(R.string.wrong_credentials), Toast.LENGTH_SHORT).show();
                                    Log.d(MainActivity.API, "GetUserService - onFailure (t.getMessage): " + t.getMessage());
                                    Log.d(MainActivity.API, "GetUserService - onFailure (call): " + call.request().toString());

                                }

                            });

                        } else {
                            Log.e(MainActivity.API, "GetUserService - onResponse (response.errorBody): " + response.errorBody());
                            Log.e(MainActivity.API, "GetUserService - onResponse (response.raw): " + response.raw().toString());
                            Log.e(MainActivity.API, "GetUserService - onResponse (response.message): " + response.message());
                            Log.e(MainActivity.API, "GetUserService - onResponse (call.request.body): " + call.request().body());
                            Toast.makeText(context, context.getResources().getString(R.string.wrong_credentials), Toast.LENGTH_SHORT).show();
                        }
                    } catch (IOException e) {
                        e.printStackTrace();
                    }
                } else {
                    Toast.makeText(context, getResources().getString(R.string.wrong_credentials), Toast.LENGTH_SHORT).show();
                    Log.e(MainActivity.API, "GetAuthService - onResponse (response.errorBody): " + response.errorBody());
                    Log.e(MainActivity.API, "GetAuthService - onResponse (response.raw): " + response.raw().toString());
                    Log.e(MainActivity.API, "GetAuthService - onResponse (response.message): " + response.message());
                    Log.e(MainActivity.API, "GetAuthService - onResponse (call.request.body): " + call.request().body());
                }
            }

            @Override
            public void onFailure(@NonNull Call<ResponseBody> call, @NonNull Throwable t) {
                progressDialog.dismiss();
                Toast.makeText(context, context.getResources().getString(R.string.check_internet_connection), Toast.LENGTH_SHORT).show();
                Log.d(MainActivity.API, "login - onFailure: " + t.getMessage());
            }

        });

    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        emailInputEditText.clearFocus();
        emailInputLayout.clearOnEditTextAttachedListeners();
        passwordInputEditText.clearFocus();
        passwordInputLayout.clearOnEditTextAttachedListeners();
    }

    public static Fragment newInstance() {
        return new SecondIntroFragment();
    }

}
