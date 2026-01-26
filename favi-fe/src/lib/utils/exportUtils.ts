import { UserDto, PostDto, ReportDto } from "@/lib/api/admin";

// ============================================================================
// CSV Export
// ============================================================================

export function exportToCSV(data: any[], filename: string) {
    if (!data || data.length === 0) {
        throw new Error("No data to export");
    }

    // Get headers from first object
    const headers = Object.keys(data[0]);

    // Create CSV content
    const csvContent = [
        headers.join(","), // Header row
        ...data.map(row =>
            headers.map(header => {
                const value = row[header];
                // Handle values that might contain commas or quotes
                if (value === null || value === undefined) return "";
                const stringValue = String(value);
                if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
                    return `"${stringValue.replace(/"/g, '""')}"`;
                }
                return stringValue;
            }).join(",")
        )
    ].join("\n");

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    downloadBlob(blob, `${filename}.csv`);
}

// ============================================================================
// JSON Export
// ============================================================================

export function exportToJSON(data: any[], filename: string) {
    if (!data || data.length === 0) {
        throw new Error("No data to export");
    }

    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" });
    downloadBlob(blob, `${filename}.json`);
}

// ============================================================================
// Excel Export (using HTML table method)
// ============================================================================

export function exportToExcel(data: any[], filename: string) {
    if (!data || data.length === 0) {
        throw new Error("No data to export");
    }

    const headers = Object.keys(data[0]);

    // Create HTML table
    const htmlTable = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>Sheet1</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines/>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #4CAF50; color: white; font-weight: bold; }
      </style>
    </head>
    <body>
      <table>
        <thead>
          <tr>
            ${headers.map(h => `<th>${h}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${data.map(row => `
            <tr>
              ${headers.map(h => `<td>${row[h] ?? ""}</td>`).join("")}
            </tr>
          `).join("")}
        </tbody>
      </table>
    </body>
    </html>
  `;

    const blob = new Blob([htmlTable], { type: "application/vnd.ms-excel" });
    downloadBlob(blob, `${filename}.xls`);
}

// ============================================================================
// Helper Functions
// ============================================================================

function downloadBlob(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}

// ============================================================================
// Data Preparation Functions
// ============================================================================

export function prepareUsersForExport(users: UserDto[]) {
    return users.map(user => ({
        ID: user.id,
        Username: user.username,
        "Display Name": user.displayName || "",
        Email: user.email || "",
        Role: user.role,
        Status: user.isBanned ? "Banned" : "Active",
        "Posts Count": user.postsCount,
        "Followers Count": user.followersCount,
        "Created At": new Date(user.createdAt).toLocaleString(),
        "Last Active": new Date(user.lastActiveAt).toLocaleString(),
    }));
}

export function preparePostsForExport(posts: PostDto[]) {
    return posts.map(post => ({
        ID: post.id,
        Caption: post.caption || "",
        Author: post.authorUsername || post.author?.username || "",
        Privacy: post.privacy || "",
        "Reactions Count": post.reactionsCount || post.likeCount || 0,
        "Comments Count": post.commentsCount || post.commentCount || 0,
        "Created At": new Date(post.createdAt).toLocaleString(),
        Deleted: post.isDeleted ? "Yes" : "No",
    }));
}

export function prepareReportsForExport(reports: ReportDto[]) {
    return reports.map(report => ({
        ID: report.id,
        "Target Type": report.targetType,
        "Target ID": report.targetId,
        Reporter: report.reporter?.username || report.reporterProfileId.substring(0, 8),
        Reason: report.reason,
        Status: report.status,
        "Created At": new Date(report.createdAt).toLocaleString(),
        "Resolved At": report.resolvedAt ? new Date(report.resolvedAt).toLocaleString() : "",
    }));
}
