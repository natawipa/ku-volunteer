export type CategoryNode = {
    label: string;
    selectable?: boolean;
    children?: CategoryNode[];
  };
  
  export type CategorySelectProps = {
    value: string[];
    onChange: (value: string[]) => void;
  };
  
  export const categories: CategoryNode[] = [
    { label: "กิจกรรมมหาวิทยาลัย", selectable: true },
    {
      label: "กิจกรรมเพื่อเสริมสร้างสมรรถนะ",
      selectable: false,
      children: [
        { label: "ด้านพัฒนาคุณธรรมและจริยธรม", selectable: true },
        { label: "ด้านพัฒนาทักษะการคิดและการเรียนรู้", selectable: true },
        { label: "ด้านพัฒนาทักษะและเสริมสร้างความสัมพันธ์ระหว่างบุคคล", selectable: true },
        { label: "ด้านพัฒนาสุขภาพ", selectable: true },
      ],
    },
    { label: "กิจกรรมเพื่อสังคม", selectable: true },
  ];