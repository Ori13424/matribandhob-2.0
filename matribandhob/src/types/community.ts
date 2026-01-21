export interface Post {
    id: string;
    authorId: string;
    authorName: string;
    authorRole: 'mother' | 'doctor';
    content: string;
    tags: string[];
    likes: number;
    likedBy: string[];
    commentCount: number;
    timestamp: any; // Firestore Timestamp
}

export interface Comment {
    id: string;
    postId: string;
    authorId: string;
    authorName: string;
    content: string;
    timestamp: any;
}
