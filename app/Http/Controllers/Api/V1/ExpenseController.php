<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Expense\StoreExpenseRequest;
use App\Http\Requests\Expense\UpdateExpenseRequest;
use App\Http\Resources\ExpenseResource;
use App\Models\Expense;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExpenseController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'shop_id' => ['nullable', 'integer', 'exists:shops,id'],
            'date_from' => ['nullable', 'date_format:Y-m-d'],
            'date_to' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:date_from'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $query = Expense::query()->with(['shop:id,name,code'])->latest('expense_date')->latest('id');

        if ($request->user()?->hasRole('manager')) {
            $filters['shop_id'] = $request->user()->shop_id;
        }

        if (($filters['shop_id'] ?? null) !== null) {
            $query->where('shop_id', $filters['shop_id']);
        }

        $search = trim((string) ($filters['search'] ?? ''));
        if ($search !== '') {
            $term = '%'.addcslashes($search, '\\%_').'%';
            $query->where(function ($query) use ($term) {
                $query->where('category', 'like', $term)
                    ->orWhere('reference_no', 'like', $term)
                    ->orWhere('note', 'like', $term);
            });
        }

        if (($filters['date_from'] ?? null) !== null) {
            $query->whereDate('expense_date', '>=', $filters['date_from']);
        }

        if (($filters['date_to'] ?? null) !== null) {
            $query->whereDate('expense_date', '<=', $filters['date_to']);
        }

        return $this->paginated(ExpenseResource::collection(
            $query->paginate((int) ($filters['per_page'] ?? 10))
        ));
    }

    public function store(StoreExpenseRequest $request): JsonResponse
    {
        $data = $request->validated();
        if ($request->user()?->hasRole('manager')) {
            $data['shop_id'] = $request->user()->shop_id;
        }
        $data['created_by'] = $request->user()->id;

        $expense = Expense::create($data)->load(['shop:id,name,code']);

        return $this->created(new ExpenseResource($expense), 'Expense created');
    }

    public function update(UpdateExpenseRequest $request, Expense $expense): JsonResponse
    {
        $data = $request->validated();
        if ($request->user()?->hasRole('manager')) {
            $data['shop_id'] = $request->user()->shop_id;
        }

        $expense->update($data);

        return $this->success(new ExpenseResource($expense->load(['shop:id,name,code'])), 'Expense updated');
    }

    public function destroy(Expense $expense): JsonResponse
    {
        $expense->delete();

        return $this->noContent();
    }
}
