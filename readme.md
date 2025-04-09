Checklists Unit Test

1. ✅ Phân tích logic function
 Có bao nhiêu loại Order cần xử lý (A, B, C, Z...)?

 Với mỗi loại, có điều kiện nào đặc biệt ảnh hưởng đến kết quả không (flag, amount, response...)?

 Có nhánh if-else, switch, hoặc điều kiện logic nào cần bao phủ toàn bộ không?


2. ✅ Xác định input / output rõ ràng
 Đầu vào function có nhiều giá trị khác nhau (type, flag, amount)?

 Đầu ra có thể trả về kiểu khác nhau? (status, boolean, exception...)

 Có trường hợp trả về null, false, undefined, hoặc error?


3. ✅ Phát hiện và kiểm thử ngoại lệ
 Có thể ném ra lỗi từ DatabaseService, APIClient, hoặc fs không?

 Cần bao phủ các lỗi bằng mock/stub không?


4. ✅ Mocking / Spying các dependency
 Tách biệt rõ giữa logic cần test và các dependency (DB, API)?

 Có mock cho DatabaseService.getOrdersByUser?

 Có mock cho DatabaseService.updateOrderStatus?

 Có mock cho APIClient.callAPI?

 Có mock fs.createWriteStream (ghi file)?


 5. ✅ Tình huống cần kiểm thử
 Trường hợp xử lý thành công (happy path)

 Trường hợp xử lý thất bại (fail path)

 Trường hợp biên (boundary conditions)

 Trường hợp input bất thường (invalid/edge case)

 Trường hợp dependency trả về lỗi (APIException, DatabaseException, throw error...)


6. ✅ Tuân thủ Clean Code & SOLID
 Function chia nhỏ, single responsibility?

 Có thể inject dependency?

 Có violate logic phức tạp lồng nhau?

 Test đặt tên rõ ràng?

 Đã test cho toàn bộ branch/condition/line?


 7. ✅ Code Coverage / CI
 Có cấu hình để chạy code coverage? (Istanbul, Jest config, --coverage)

 Có báo cáo coverage (HTML, XML)?

 Đảm bảo coverage > 90% (nếu cần)?

 Test có chạy trong pipeline CI/CD?


TESTING RESULT:
  PASS  __tests__/OrderProcessingService.test.ts
  OrderProcessingService
    ✓ returns false if getOrdersByUser throws (3 ms)
    ✓ handles DatabaseException from updateOrderStatus
    ✓ writes Note line when amount > 150 in type A (2 ms)
    ✓ sets status error for type B when api returns success but condition unmatched
    basic processing
      ✓ processes type A and expects exported (1 ms)
      ✓ processes type C and expects completed (1 ms)
      ✓ processes type C and expects in_progress (1 ms)
      ✓ processes type Z and expects unknown_type
    Type A export failure
      ✓ sets status export_failed when fs write fails
    Type B with API scenarios
      ✓ api success and processed condition
      ✓ api success and pending condition (1 ms)
      ✓ api returns fail response (1 ms)
      ✓ throws APIException (1 ms)

---------------------------|---------|----------|---------|---------|-------------------
File                       | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
---------------------------|---------|----------|---------|---------|-------------------
All files                  |     100 |    95.65 |     100 |     100 |
 APIException.ts           |     100 |      100 |     100 |     100 |
 APIResponse.ts            |     100 |      100 |     100 |     100 |
 DatabaseException.ts      |     100 |      100 |     100 |     100 |
 Order.ts                  |     100 |      100 |     100 |     100 |
 OrderProcessingService.ts |     100 |    95.65 |     100 |     100 | 29
---------------------------|---------|----------|---------|---------|-------------------
Test Suites: 1 passed, 1 total
Tests:       13 passed, 13 total
Snapshots:   0 total
Time:        1.108 s, estimated 4 s