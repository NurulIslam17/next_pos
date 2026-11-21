<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\User\ChangePasswordRequest;
use App\Http\Requests\User\UpdateProfileRequest;
use App\Http\Resources\UserResource;
use App\Services\UserService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

class ProfileController extends Controller
{
    use ApiResponse;

    public function __construct(protected UserService $users) {}

    public function update(UpdateProfileRequest $request): JsonResponse
    {
        $user = $this->users->updateProfile(
            $request->user(),
            $request->safe()->only([
                'name',
                'email',
                'phone',
                'nid_number',
                'date_of_birth',
                'joining_date',
                'bank_name',
                'salary_account_name',
                'salary_account_number',
                'permanent_address',
                'present_address',
            ]),
            $request->file('photo'),
            $request->boolean('remove_photo'),
        );

        return $this->success((new UserResource($user))->withPermissions(), 'Profile updated');
    }

    public function changePassword(ChangePasswordRequest $request): JsonResponse
    {
        $this->users->changePassword($request->user(), $request->string('password')->toString());

        return $this->success(null, 'Password changed');
    }
}
